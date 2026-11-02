package com.estetica.service;

import com.estetica.config.JwtService;
import com.estetica.dto.AuthDTOs.*;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.Role;
import com.estetica.model.Usuario;
import com.estetica.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse registrarCliente(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new RegraNegocioException("O e-mail informado já está cadastrado.");
        }

        Usuario usuario = Usuario.builder()
                .nome(request.nome().trim())
                .email(request.email().toLowerCase().trim())
                .telefoneWhatsApp(request.telefoneWhatsApp().replaceAll("[^0-9]", ""))
                .senhaHash(passwordEncoder.encode(request.senha()))
                .role(Role.ROLE_CLIENTE)
                .ativo(true)
                .build();

        usuario = usuarioRepository.save(usuario);
        String token = jwtService.gerarToken(usuario);

        return new AuthResponse(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefoneWhatsApp(),
                usuario.getRole()
        );
    }

    @Transactional
    public AuthResponse registrarAdminMaster(RegisterRequest request) {
        if (usuarioRepository.countByRole(Role.ROLE_ADMIN) > 0) {
            throw new RegraNegocioException("O sistema já possui um Administrador Master cadastrado.");
        }

        if (usuarioRepository.existsByEmail(request.email().toLowerCase().trim())) {
            throw new RegraNegocioException("O e-mail informado já está cadastrado.");
        }

        Usuario admin = Usuario.builder()
                .nome(request.nome().trim())
                .email(request.email().toLowerCase().trim())
                .telefoneWhatsApp(request.telefoneWhatsApp().replaceAll("[^0-9]", ""))
                .senhaHash(passwordEncoder.encode(request.senha()))
                .role(Role.ROLE_ADMIN)
                .ativo(true)
                .build();

        admin = usuarioRepository.save(admin);
        String token = jwtService.gerarToken(admin);

        return new AuthResponse(
                token,
                admin.getId(),
                admin.getNome(),
                admin.getEmail(),
                admin.getTelefoneWhatsApp(),
                admin.getRole()
        );
    }

    public AuthResponse autenticar(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas"));

        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new BadCredentialsException("Credenciais inválidas");
        }

        if (!usuario.isEnabled()) {
            throw new RegraNegocioException("Usuário inativo. Entre em contato com o suporte.");
        }

        String token = jwtService.gerarToken(usuario);

        return new AuthResponse(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefoneWhatsApp(),
                usuario.getRole()
        );
    }
}

