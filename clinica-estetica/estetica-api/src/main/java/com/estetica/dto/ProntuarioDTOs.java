package com.estetica.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class ProntuarioDTOs {

    public record SalvarProntuarioRequest(
        @NotNull(message = "Cliente é obrigatório")
        Long clienteId,

        Long profissionalId,
        Long agendamentoId,

        @NotBlank(message = "Notas de anamnese são obrigatórias")
        String notasAnamnese,

        String orientacoesPosProcedimento,
        String reacoesAdversas
    ) {}

    public record HistoricoAtendimentoDTO(
        Long id,
        Long clienteId,
        String clienteNome,
        Long profissionalId,
        String profissionalNome,
        Long agendamentoId,
        LocalDateTime dataAtendimento,
        String notasAnamnese,
        String orientacoesPosProcedimento,
        String reacoesAdversas
    ) {}
}

