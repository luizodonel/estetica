package com.estetica.dto;

import com.estetica.model.StatusAgendamento;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AgendamentoDTOs {

    public record CriarAgendamentoRequest(
        Long clienteId, // Obrigatório se marcado por Admin/Profissional

        @NotNull(message = "Procedimento é obrigatório")
        Long procedimentoId,

        Long profissionalId, // Se nulo, escolhe o primeiro disponível

        @NotNull(message = "Data e horário de início são obrigatórios")
        LocalDateTime dataHoraInicio,

        String observacoesCliente
    ) {}

    public record RemarcarAgendamentoRequest(
        @NotNull(message = "Nova data e horário são obrigatórios")
        LocalDateTime novaDataHoraInicio,

        Long novoProfissionalId
    ) {}

    public record AtualizarStatusRequest(
        @NotNull(message = "Status é obrigatório")
        StatusAgendamento status,

        String notasInternas
    ) {}

    public record AgendamentoDTO(
        Long id,
        Long clienteId,
        String clienteNome,
        String clienteEmail,
        String clienteWhatsApp,
        Long profissionalId,
        String profissionalNome,
        String profissionalFotoUrl,
        String profissionalCor,
        Long procedimentoId,
        String procedimentoTitulo,
        Integer procedimentoDuracao,
        BigDecimal valorCobrado,
        LocalDateTime dataHoraInicio,
        LocalDateTime dataHoraFim,
        StatusAgendamento status,
        String observacoesCliente,
        String notasInternas,
        LocalDateTime dataCriacao
    ) {}
}

