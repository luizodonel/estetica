package com.estetica.dto;

import com.estetica.dto.AuthDTOs.UsuarioDTO;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class TenantDTOs {

    public record CadastroLojistaRequest(
        @NotBlank(message = "O nome da empresa é obrigatório")
        @Size(min = 3, max = 120, message = "O nome da empresa deve ter entre 3 e 120 caracteres")
        String nomeEmpresa,

        @NotBlank(message = "O link/subdomínio exclusivo é obrigatório")
        @Pattern(regexp = "^[a-z0-9-]+$", message = "O subdomínio deve conter apenas letras minúsculas, números e hífens")
        String slug,

        String logoUrl,

        String corPrimaria,

        String corSecundaria,

        @NotBlank(message = "O nome do responsável é obrigatório")
        String nomeResponsavel,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
        String email,

        @NotBlank(message = "O WhatsApp é obrigatório")
        String telefoneWhatsApp,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres")
        String senha
    ) {}

    public record TenantPublicDTO(
        Long id,
        String nomeEmpresa,
        String slug,
        String linkPersonalizado,
        String logoUrl,
        String corPrimaria,
        String corSecundaria,
        String telefoneWhatsApp,
        String bannerTag,
        String bannerTitulo,
        String bannerSubtitulo,
        String bannerBotaoTexto
    ) {}

    public record AtualizarBannerRequest(
        String bannerTag,
        String bannerTitulo,
        String bannerSubtitulo,
        String bannerBotaoTexto
    ) {}

    public record CadastroLojistaResponse(
        String token,
        String linkPersonalizado,
        TenantPublicDTO tenant,
        UsuarioDTO usuario
    ) {}
}

