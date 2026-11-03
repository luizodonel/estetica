package com.estetica.dto;

import com.estetica.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDTOs {

    public record LoginRequest(
        String login,
        String email,
        String telefone,

        @NotBlank(message = "A senha é obrigatória")
        String senha,

        String host,
        String origin
    ) {
        public String getIdentificador() {
            if (login != null && !login.isBlank()) return login.trim();
            if (telefone != null && !telefone.isBlank()) return telefone.trim();
            if (email != null && !email.isBlank()) return email.trim();
            return "";
        }
    }

    public record PrimeiroAcessoRequest(
        @NotBlank(message = "O número de telefone/WhatsApp é obrigatório")
        String telefoneWhatsApp,

        @NotBlank(message = "A nova senha é obrigatória")
        @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres")
        String novaSenha
    ) {}

    public record VerificarPrimeiroAcessoResponse(
        boolean existe,
        String nome,
        boolean primeiroAcesso
    ) {}

    public record RegisterRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(min = 3, max = 120, message = "O nome deve ter entre 3 e 120 caracteres")
        String nome,

        String email,

        @NotBlank(message = "O WhatsApp é obrigatório")
        String telefoneWhatsApp,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres")
        String senha
    ) {}

    public record AuthResponse(
        String token,
        Long id,
        String nome,
        String email,
        String telefoneWhatsApp,
        Role role,
        Boolean primeiroAcesso,
        String tenantSlug,
        String nomeEmpresa,
        String logoUrl,
        String setor
    ) {}

    public record CriarClienteRequest(
        @NotBlank(message = "O nome é obrigatório")
        String nome,

        String email,

        @NotBlank(message = "O WhatsApp é obrigatório")
        String telefoneWhatsApp,

        String senha
    ) {}

    public record UsuarioDTO(
        Long id,
        String nome,
        String email,
        String telefoneWhatsApp,
        Role role,
        Boolean ativo,
        Boolean primeiroAcesso
    ) {}
}

