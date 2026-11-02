package com.estetica.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardDTOs {

    public record DashboardResumoDTO(
        long agendamentosHoje,
        long agendamentosConfirmadosHoje,
        long agendamentosPendentesHoje,
        long totalClientesAtivos,
        BigDecimal faturamentoEstimadoHoje,
        List<AgendamentoDTOs.AgendamentoDTO> proximosAtendimentos
    ) {}
}

