package com.estetica.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;

public class RedeSocialDTOs {

    public record InstagramStatusResponse(
            boolean appConfigurado,
            boolean conectado,
            String igUserId,
            String igUsername,
            String igName,
            String igAccountType,
            String igProfilePictureUrl,
            LocalDateTime tokenExpiraEm,
            String redirectUriConfigurada,
            List<PostSocialDTO> historicoPosts
    ) {}

    public record AuthUrlResponse(
            String authUrl,
            String redirectUri
    ) {}

    public record PublicarInstagramRequest(
            @NotBlank(message = "A imagem do banner é obrigatória.")
            String imagemUrl,
            String legenda,
            @NotBlank(message = "Selecione o formato: FEED ou STORIES.")
            String tipoMidia // FEED ou STORIES
    ) {}

    public record PostSocialDTO(
            Long id,
            String plataforma,
            String tipoMidia,
            String imagemUrl,
            String legenda,
            String igMediaId,
            String permalink,
            String status,
            String mensagemErro,
            LocalDateTime publicadoEm,
            LocalDateTime criadoEm
    ) {}
}
