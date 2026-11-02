package com.estetica.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardDTOs {

    public record FaturamentoEspecialistaDTO(
        Long profissionalId,
        String profissionalNome,
        String fotoUrl,
        String especialidade,
        String corIdentificacao,
        long totalAtendimentos,
        BigDecimal totalFaturado
    ) {}

    public record DashboardResumoDTO(
        long agendamentosHoje,
        long agendamentosConfirmadosHoje,
        long agendamentosPendentesHoje,
        long totalClientesAtivos,
        BigDecimal faturamentoEstimadoHoje,
        List<AgendamentoDTOs.AgendamentoDTO> proximosAtendimentos,
        List<FaturamentoEspecialistaDTO> faturamentoPorEspecialista,
        boolean isAdmin
    ) {}
}

