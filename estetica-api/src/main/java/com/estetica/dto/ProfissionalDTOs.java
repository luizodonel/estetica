package com.estetica.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

public class ProfissionalDTOs {

    public record CriarProfissionalRequest(
        @NotBlank(message = "O nome é obrigatório")
        String nome,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
        String email,

        @NotBlank(message = "O WhatsApp é obrigatório")
        String telefoneWhatsApp,

        String senha,

        @NotBlank(message = "A especialidade é obrigatória")
        String especialidade,

        String bio,
        String fotoUrl,
        String corIdentificacao,
        List<Long> procedimentosIds
    ) {}

    public record ProfissionalDTO(
        Long id,
        Long usuarioId,
        String nome,
        String email,
        String telefoneWhatsApp,
        String especialidade,
        String bio,
        String fotoUrl,
        String corIdentificacao,
        Boolean ativo,
        List<Long> procedimentosIds
    ) {}

    public record HorarioTrabalhoDTO(
        Long id,
        Long profissionalId,
        DayOfWeek diaSemana,
        LocalTime horaInicio,
        LocalTime horaFim,
        LocalTime inicioIntervalo,
        LocalTime fimIntervalo,
        Boolean ativo
    ) {}

    public record BloqueioAgendaDTO(
        Long id,
        Long profissionalId,
        java.time.LocalDateTime dataInicio,
        java.time.LocalDateTime dataFim,
        String motivo
    ) {}

    public record CriarBloqueioRequest(
        java.time.LocalDateTime dataInicio,
        java.time.LocalDateTime dataFim,
        String motivo
    ) {}

    public record SalvarJornadaItemRequest(
        DayOfWeek diaSemana,
        LocalTime horaInicio,
        LocalTime horaFim,
        LocalTime inicioIntervalo,
        LocalTime fimIntervalo,
        Boolean ativo
    ) {}
}

