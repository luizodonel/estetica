package com.estetica.dto;

import com.estetica.model.StatusAgendamento;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class RelatorioDTOs {

    public record RelatorioEspecialistaItemDTO(
        Long agendamentoId,
        LocalDateTime dataHoraInicio,
        LocalDateTime dataHoraFim,
        String clienteNome,
        String clienteWhatsApp,
        String procedimentoTitulo,
        String categoriaNome,
        Integer duracaoMinutos,
        BigDecimal valorCobrado,
        StatusAgendamento status,
        String notasInternas
    ) {}

    public record RelatorioEspecialistaDTO(
        Long profissionalId,
        String profissionalNome,
        String especialidade,
        String fotoUrl,
        String corIdentificacao,
        Long totalAtendimentos,
        BigDecimal totalFaturado,
        BigDecimal ticketMedio,
        List<RelatorioEspecialistaItemDTO> atendimentos
    ) {}

    public record RelatorioGeralResponse(
        String nomeEmpresa,
        String logoUrl,
        LocalDate dataInicio,
        LocalDate dataFim,
        Long totalAtendimentosGeral,
        BigDecimal totalFaturadoGeral,
        BigDecimal ticketMedioGeral,
        List<RelatorioEspecialistaDTO> especialistas
    ) {}
}
