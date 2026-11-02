package com.estetica.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class DisponibilidadeDTOs {

    public record SlotDisponivelDTO(
        LocalTime horarioInicio,
        LocalTime horarioFim,
        Long profissionalId,
        String profissionalNome,
        String profissionalFotoUrl,
        String profissionalCor
    ) {}

    public record DisponibilidadeResponseDTO(
        LocalDate data,
        Long procedimentoId,
        String procedimentoTitulo,
        Integer duracaoMinutos,
        List<SlotDisponivelDTO> slots
    ) {}
}

