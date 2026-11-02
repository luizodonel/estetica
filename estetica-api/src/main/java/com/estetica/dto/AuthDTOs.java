package com.estetica.dto;

import com.estetica.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDTOs {

    public record LoginRequest(
        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
        String email,

        @NotBlank(message = "A senha é obrigatória")
        String senha
    ) {}

    public record RegisterRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(min = 3, max = 120, message = "O nome deve ter entre 3 e 120 caracteres")
        String nome,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
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
        Role role
    ) {}

    public record CriarClienteRequest(
        @NotBlank(message = "O nome é obrigatório")
        String nome,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
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
        Boolean ativo
    ) {}
}

