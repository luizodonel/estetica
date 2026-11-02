package com.estetica.service;

import com.estetica.dto.AgendamentoDTOs.AgendamentoDTO;
import com.estetica.dto.DashboardDTOs.DashboardResumoDTO;
import com.estetica.model.Agendamento;
import com.estetica.model.Role;
import com.estetica.model.StatusAgendamento;
import com.estetica.repository.AgendamentoRepository;
import com.estetica.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AgendamentoService agendamentoService;

    @Transactional(readOnly = true)
    public DashboardResumoDTO obterResumoHoje() {
        LocalDate hoje = LocalDate.now();
        LocalDateTime inicioDia = hoje.atStartOfDay();
        LocalDateTime fimDia = hoje.atTime(23, 59, 59);

        List<Agendamento> agendamentosHojeList = agendamentoRepository.findAgendamentosCalendario(inicioDia, fimDia);

        long totalHoje = agendamentosHojeList.size();
        long confirmadosHoje = agendamentosHojeList.stream()
                .filter(a -> a.getStatus() == StatusAgendamento.CONFIRMADO || a.getStatus() == StatusAgendamento.CONCLUIDO)
                .count();
        long pendentesHoje = agendamentosHojeList.stream()
                .filter(a -> a.getStatus() == StatusAgendamento.PENDENTE)
                .count();

        BigDecimal faturamentoHoje = agendamentosHojeList.stream()
                .filter(a -> a.getStatus() != StatusAgendamento.CANCELADO && a.getStatus() != StatusAgendamento.NO_SHOW)
                .map(Agendamento::getValorCobrado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long clientesAtivos = usuarioRepository.findByRoleOrderByNomeAsc(Role.ROLE_CLIENTE).size();

        List<AgendamentoDTO> proximos = agendamentosHojeList.stream()
                .filter(a -> a.getDataHoraFim().isAfter(LocalDateTime.now()) && a.getStatus() != StatusAgendamento.CANCELADO)
                .limit(5)
                .map(agendamentoService::toDTO)
                .toList();

        return new DashboardResumoDTO(
                totalHoje,
                confirmadosHoje,
                pendentesHoje,
                clientesAtivos,
                faturamentoHoje,
                proximos
        );
    }
}

