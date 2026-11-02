package com.estetica.service;

import com.estetica.dto.AgendamentoDTOs.AgendamentoDTO;
import com.estetica.dto.DashboardDTOs.DashboardResumoDTO;
import com.estetica.dto.DashboardDTOs.FaturamentoEspecialistaDTO;
import com.estetica.model.*;
import com.estetica.repository.AgendamentoRepository;
import com.estetica.repository.ProfissionalRepository;
import com.estetica.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProfissionalRepository profissionalRepository;
    private final AgendamentoService agendamentoService;
    private final TenantResolverService tenantResolverService;

    @Transactional(readOnly = true)
    public DashboardResumoDTO obterResumoHoje() {
        LocalDate hoje = LocalDate.now(DisponibilidadeService.ZONE_BRASIL);
        LocalDateTime inicioDia = hoje.atStartOfDay();
        LocalDateTime fimDia = hoje.atTime(23, 59, 59);

        // Identifica o usuário logado e seu perfil de acesso
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioLogado = null;
        if (auth != null && auth.getPrincipal() instanceof Usuario u) {
            usuarioLogado = u;
        }

        boolean isAdmin = usuarioLogado == null || usuarioLogado.getRole() == Role.ROLE_ADMIN;
        Profissional profLogado = null;

        if (usuarioLogado != null && usuarioLogado.getRole() == Role.ROLE_PROFISSIONAL) {
            profLogado = profissionalRepository.findByUsuarioId(usuarioLogado.getId()).orElse(null);
        }

        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        Long tenantId = tenant != null ? tenant.getId() : null;

        List<Agendamento> todosAgendamentosHoje = (tenantId != null)
                ? agendamentoRepository.findAgendamentosCalendarioTenant(tenantId, inicioDia, fimDia)
                : agendamentoRepository.findAgendamentosCalendario(inicioDia, fimDia);

        // Se for um especialista, ele SÓ pode visualizar os atendimentos e o faturamento DELE
        List<Agendamento> agendamentosFiltrados;
        if (!isAdmin && profLogado != null) {
            final Long profId = profLogado.getId();
            agendamentosFiltrados = todosAgendamentosHoje.stream()
                    .filter(a -> a.getProfissional() != null && a.getProfissional().getId().equals(profId))
                    .toList();
        } else {
            agendamentosFiltrados = todosAgendamentosHoje;
        }

        long totalHoje = agendamentosFiltrados.size();
        long confirmadosHoje = agendamentosFiltrados.stream()
                .filter(a -> a.getStatus() == StatusAgendamento.CONFIRMADO || a.getStatus() == StatusAgendamento.CONCLUIDO)
                .count();
        long pendentesHoje = agendamentosFiltrados.stream()
                .filter(a -> a.getStatus() == StatusAgendamento.PENDENTE)
                .count();

        // Faturamento: se for especialista, soma apenas o que ele atendeu. Se for admin, soma o total.
        BigDecimal faturamentoHoje = agendamentosFiltrados.stream()
                .filter(a -> a.getStatus() != StatusAgendamento.CANCELADO && a.getStatus() != StatusAgendamento.NO_SHOW)
                .map(Agendamento::getValorCobrado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long clientesAtivos = (tenantId != null)
                ? usuarioRepository.countClientesPorTenantOuSemTenant(tenantId, Role.ROLE_CLIENTE)
                : (long) usuarioRepository.findByRoleOrderByNomeAsc(Role.ROLE_CLIENTE).size();

        // Próximos atendimentos a partir de agora (não apenas restritos a hoje, trazendo próximos dias)
        List<Agendamento> proximosBrutos = agendamentoRepository.findProximosAgendamentos(
                tenantId,
                LocalDateTime.now(DisponibilidadeService.ZONE_BRASIL),
                PageRequest.of(0, 10)
        );

        if (!isAdmin && profLogado != null) {
            final Long profId = profLogado.getId();
            proximosBrutos = proximosBrutos.stream()
                    .filter(a -> a.getProfissional() != null && a.getProfissional().getId().equals(profId))
                    .toList();
        }

        List<AgendamentoDTO> proximos = proximosBrutos.stream()
                .limit(5)
                .map(agendamentoService::toDTO)
                .toList();

        // Faturamento detalhado por especialista (Apenas visível para ROLE_ADMIN daquela clínica)
        List<FaturamentoEspecialistaDTO> faturamentoPorEspecialista = new ArrayList<>();
        if (isAdmin) {
            List<Profissional> todosProfissionais = (tenantId != null)
                    ? profissionalRepository.findByTenantIdAndAtivoTrueOrderByNomeAsc(tenantId)
                    : profissionalRepository.findByAtivoTrueOrderByNomeAsc();

            for (Profissional prof : todosProfissionais) {
                List<Agendamento> agendsProf = todosAgendamentosHoje.stream()
                        .filter(a -> a.getProfissional() != null && a.getProfissional().getId().equals(prof.getId()))
                        .toList();

                long qtdAtendimentos = agendsProf.stream()
                        .filter(a -> a.getStatus() != StatusAgendamento.CANCELADO)
                        .count();

                BigDecimal totalProf = agendsProf.stream()
                        .filter(a -> a.getStatus() != StatusAgendamento.CANCELADO && a.getStatus() != StatusAgendamento.NO_SHOW)
                        .map(Agendamento::getValorCobrado)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                faturamentoPorEspecialista.add(new FaturamentoEspecialistaDTO(
                        prof.getId(),
                        prof.getNome(),
                        prof.getFotoUrl(),
                        prof.getEspecialidade(),
                        prof.getCorIdentificacao(),
                        qtdAtendimentos,
                        totalProf
                ));
            }
        }

        return new DashboardResumoDTO(
                totalHoje,
                confirmadosHoje,
                pendentesHoje,
                clientesAtivos,
                faturamentoHoje,
                proximos,
                faturamentoPorEspecialista,
                isAdmin
        );
    }
}

