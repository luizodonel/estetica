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
    private final TenantResolverService tenantResolverService;

    @Transactional
    public AuthResponse registrarCliente(RegisterRequest request) {
        String telefone = request.telefoneWhatsApp().replaceAll("[^0-9]", "");
        if (usuarioRepository.existsByTelefoneWhatsApp(telefone)) {
            throw new RegraNegocioException("O WhatsApp informado já está cadastrado.");
        }

        String email = (request.email() != null && !request.email().isBlank()) 
                ? request.email().toLowerCase().trim() 
                : "tel" + telefone + "@cliente.local";

        if (request.email() != null && !request.email().isBlank() && usuarioRepository.existsByEmail(email)) {
            throw new RegraNegocioException("O e-mail informado já está cadastrado.");
        }

        Usuario usuario = Usuario.builder()
                .nome(request.nome().trim())
                .email(email)
                .telefoneWhatsApp(telefone)
                .senhaHash(passwordEncoder.encode(request.senha()))
                .role(Role.ROLE_CLIENTE)
                .tenant(tenantResolverService.getTenantDoUsuarioAutenticado())
                .primeiroAcesso(false)
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
                usuario.getRole(),
                usuario.getPrimeiroAcesso()
        );
    }

    @Transactional
    public AuthResponse registrarAdminMaster(RegisterRequest request) {
        if (usuarioRepository.countByRole(Role.ROLE_ADMIN) > 0) {
            throw new RegraNegocioException("O sistema já possui um Administrador Master cadastrado.");
        }

        String telefone = request.telefoneWhatsApp().replaceAll("[^0-9]", "");
        String email = (request.email() != null && !request.email().isBlank()) 
                ? request.email().toLowerCase().trim() 
                : "admin@estetica.local";

        if (usuarioRepository.existsByEmail(email)) {
            throw new RegraNegocioException("O e-mail informado já está cadastrado.");
        }

        Usuario admin = Usuario.builder()
                .nome(request.nome().trim())
                .email(email)
                .telefoneWhatsApp(telefone)
                .senhaHash(passwordEncoder.encode(request.senha()))
                .role(Role.ROLE_ADMIN)
                .primeiroAcesso(false)
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
                admin.getRole(),
                admin.getPrimeiroAcesso()
        );
    }

    public AuthResponse autenticar(LoginRequest request) {
        String iden = request.getIdentificador();
        if (iden.isBlank()) {
            throw new BadCredentialsException("Informe seu telefone ou WhatsApp para acessar.");
        }

        String digits = iden.replaceAll("[^0-9]", "");
        Usuario usuario = null;

        // 1. Tenta buscar pelo número de telefone (dígitos limpos)
        if (digits.length() >= 8) {
            usuario = usuarioRepository.findByTelefoneWhatsApp(digits).orElse(null);
            if (usuario == null) {
                usuario = usuarioRepository.findByTelefoneWhatsApp(iden).orElse(null);
            }
        }

        // 2. Tenta buscar por e-mail caso não tenha encontrado pelo telefone
        if (usuario == null) {
            usuario = usuarioRepository.findByEmail(iden.toLowerCase().trim()).orElse(null);
        }

        if (usuario == null) {
            throw new BadCredentialsException("Credenciais inválidas: usuário não encontrado com o telefone/e-mail informado.");
        }

        // 3. Se estiver no primeiro acesso ou sem senha definida
        if (Boolean.TRUE.equals(usuario.getPrimeiroAcesso()) || usuario.getSenhaHash() == null) {
            throw new RegraNegocioException("Primeiro acesso detectado! Por favor, use a opção 'Primeiro Acesso' para definir sua senha.");
        }

        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new BadCredentialsException("Senha incorreta. Tente novamente.");
        }

        if (!usuario.isEnabled()) {
            throw new RegraNegocioException("Usuário inativo. Entre em contato com o suporte ou a clínica.");
        }

        String token = jwtService.gerarToken(usuario);

        return new AuthResponse(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefoneWhatsApp(),
                usuario.getRole(),
                usuario.getPrimeiroAcesso()
        );
    }

    // =========================================================================
    // PRIMEIRO ACESSO: DEFINIÇÃO DE SENHA PARA ESPECIALISTAS E CLIENTES
    // =========================================================================
    @Transactional(readOnly = true)
    public VerificarPrimeiroAcessoResponse verificarPrimeiroAcesso(String telefone) {
        String digits = telefone != null ? telefone.replaceAll("[^0-9]", "") : "";
        if (digits.isBlank()) {
            return new VerificarPrimeiroAcessoResponse(false, "", false);
        }

        Usuario usuario = usuarioRepository.findByTelefoneWhatsApp(digits)
                .orElse(usuarioRepository.findByTelefoneWhatsApp(telefone).orElse(null));

        if (usuario == null) {
            return new VerificarPrimeiroAcessoResponse(false, "", false);
        }

        boolean precisaPrimeiroAcesso = Boolean.TRUE.equals(usuario.getPrimeiroAcesso()) || usuario.getSenhaHash() == null;
        return new VerificarPrimeiroAcessoResponse(true, usuario.getNome(), precisaPrimeiroAcesso);
    }

    @Transactional
    public AuthResponse primeiroAcesso(PrimeiroAcessoRequest request) {
        String digits = request.telefoneWhatsApp().replaceAll("[^0-9]", "");
        Usuario usuario = usuarioRepository.findByTelefoneWhatsApp(digits)
                .orElse(usuarioRepository.findByTelefoneWhatsApp(request.telefoneWhatsApp())
                        .orElseThrow(() -> new RegraNegocioException("Nenhum cadastro encontrado com o WhatsApp: " + request.telefoneWhatsApp())));

        if (!usuario.isEnabled()) {
            throw new RegraNegocioException("Usuário inativo. Entre em contato com a clínica.");
        }

        usuario.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        usuario.setPrimeiroAcesso(false);
        usuario = usuarioRepository.save(usuario);

        String token = jwtService.gerarToken(usuario);

        return new AuthResponse(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefoneWhatsApp(),
                usuario.getRole(),
                false
        );
    }
}

