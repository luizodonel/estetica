package com.estetica.service;

import com.estetica.dto.RelatorioDTOs.*;
import com.estetica.model.*;
import com.estetica.repository.AgendamentoRepository;
import com.estetica.repository.ProfissionalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RelatorioService {

    private final AgendamentoRepository agendamentoRepository;
    private final ProfissionalRepository profissionalRepository;
    private final TenantResolverService tenantResolverService;

    @Transactional(readOnly = true)
    public RelatorioGeralResponse gerarRelatorio(LocalDate dataInicio, LocalDate dataFim, Long profissionalId, StatusAgendamento status) {
        // Padrão de datas: se não informadas, assume o mês corrente
        LocalDate hoje = LocalDate.now();
        if (dataInicio == null) {
            dataInicio = hoje.withDayOfMonth(1);
        }
        if (dataFim == null) {
            dataFim = hoje;
        }

        LocalDateTime inicio = dataInicio.atStartOfDay();
        LocalDateTime fim = dataFim.atTime(23, 59, 59);

        // Resolve Tenant
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        Long tenantId = tenant != null ? tenant.getId() : null;
        String nomeEmpresa = tenant != null ? tenant.getNomeEmpresa() : "Estabelecimento";
        String logoUrl = tenant != null ? tenant.getLogoUrl() : null;

        // Se for um profissional logado (não admin), restringe ao próprio perfil
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Usuario u && u.getRole() == Role.ROLE_PROFISSIONAL) {
            Profissional profLogado = profissionalRepository.findByUsuarioId(u.getId()).orElse(null);
            if (profLogado != null) {
                profissionalId = profLogado.getId();
            }
        }

        // Busca todos os agendamentos no período
        List<Agendamento> agendamentos = agendamentoRepository.findAgendamentosParaRelatorio(
                tenantId,
                profissionalId,
                inicio,
                fim,
                status
        );

        // Se nenhum status específico foi pedido, ignora os cancelados no cálculo financeiro
        if (status == null) {
            agendamentos = agendamentos.stream()
                    .filter(a -> a.getStatus() != StatusAgendamento.CANCELADO)
                    .toList();
        }

        // Busca a lista de profissionais aplicáveis para montar a estrutura
        List<Profissional> profissionais;
        if (profissionalId != null) {
            Profissional profFiltrado = profissionalRepository.findById(profissionalId).orElse(null);
            if (profFiltrado != null) {
                tenantResolverService.validarPertenceAoTenantAtual(profFiltrado.getTenant(),
                        "Acesso negado: Este especialista pertence a outro estabelecimento.");
                profissionais = List.of(profFiltrado);
            } else {
                profissionais = List.of();
            }
        } else {
            profissionais = tenantId != null
                    ? profissionalRepository.findByTenantIdAndAtivoTrueOrderByNomeAsc(tenantId)
                    : profissionalRepository.findByAtivoTrueOrderByNomeAsc();
        }

        List<RelatorioEspecialistaDTO> especialistasDTO = new ArrayList<>();
        long totalAtendimentosGeral = 0;
        BigDecimal totalFaturadoGeral = BigDecimal.ZERO;

        for (Profissional prof : profissionais) {
            List<Agendamento> agendamentosProf = agendamentos.stream()
                    .filter(a -> a.getProfissional() != null && a.getProfissional().getId().equals(prof.getId()))
                    .sorted(Comparator.comparing(Agendamento::getDataHoraInicio))
                    .toList();

            List<RelatorioEspecialistaItemDTO> itens = agendamentosProf.stream()
                    .map(a -> new RelatorioEspecialistaItemDTO(
                            a.getId(),
                            a.getDataHoraInicio(),
                            a.getDataHoraFim(),
                            a.getCliente() != null ? a.getCliente().getNome() : "Cliente",
                            a.getCliente() != null ? a.getCliente().getTelefoneWhatsApp() : "",
                            a.getProcedimento() != null ? a.getProcedimento().getTitulo() : "Procedimento",
                            a.getProcedimento() != null && a.getProcedimento().getCategoria() != null ? a.getProcedimento().getCategoria().getNome() : "Geral",
                            a.getProcedimento() != null ? a.getProcedimento().getDuracaoMinutos() : 30,
                            a.getValorCobrado() != null ? a.getValorCobrado() : BigDecimal.ZERO,
                            a.getStatus(),
                            a.getNotasInternas()
                    ))
                    .toList();

            long qtdAtendimentos = itens.size();
            BigDecimal totalFaturado = itens.stream()
                    .map(RelatorioEspecialistaItemDTO::valorCobrado)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal ticketMedio = qtdAtendimentos > 0
                    ? totalFaturado.divide(BigDecimal.valueOf(qtdAtendimentos), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            especialistasDTO.add(new RelatorioEspecialistaDTO(
                    prof.getId(),
                    prof.getNome(),
                    prof.getEspecialidade(),
                    prof.getFotoUrl(),
                    prof.getCorIdentificacao(),
                    qtdAtendimentos,
                    totalFaturado,
                    ticketMedio,
                    itens
            ));

            totalAtendimentosGeral += qtdAtendimentos;
            totalFaturadoGeral = totalFaturadoGeral.add(totalFaturado);
        }

        BigDecimal ticketMedioGeral = totalAtendimentosGeral > 0
                ? totalFaturadoGeral.divide(BigDecimal.valueOf(totalAtendimentosGeral), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new RelatorioGeralResponse(
                nomeEmpresa,
                logoUrl,
                dataInicio,
                dataFim,
                totalAtendimentosGeral,
                totalFaturadoGeral,
                ticketMedioGeral,
                especialistasDTO
        );
    }
}

