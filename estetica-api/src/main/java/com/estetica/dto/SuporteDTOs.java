package com.estetica.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class SuporteDTOs {

    public record CriarChamadoSuporteRequest(
        @NotBlank(message = "Informe seu nome")
        @Size(max = 120)
        String nome,

        @NotBlank(message = "Informe seu WhatsApp com DDD")
        @Size(max = 30)
        String whatsapp,

        String email,

        String nomeEmpresa,

        @NotBlank(message = "Informe o assunto da sua dúvida")
        @Size(max = 160)
        String assunto,

        String categoria,

        @NotBlank(message = "Escreva sua dúvida ou mensagem")
        String mensagem,

        String origem
    ) {}

    public record ResponderChamadoClienteRequest(
        @NotBlank(message = "Informe seu WhatsApp para validar o envio")
        String whatsapp,

        @NotBlank(message = "Escreva sua mensagem")
        String mensagem
    ) {}

    public record SuporteMensagemDTO(
        Long id,
        Long chamadoId,
        String remetente,
        String autorNome,
        String mensagem,
        LocalDateTime criadoEm
    ) {}

    public record SuporteChamadoDTO(
        Long id,
        String protocolo,
        String nome,
        String whatsapp,
        String email,
        String nomeEmpresa,
        String assunto,
        String categoria,
        String status,
        String origem,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        LocalDateTime respondidoEm,
        List<SuporteMensagemDTO> mensagens
    ) {}
}
