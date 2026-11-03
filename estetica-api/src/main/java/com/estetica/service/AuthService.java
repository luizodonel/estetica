package com.estetica.service;

import com.estetica.config.JwtService;
import com.estetica.dto.AuthDTOs.*;
import com.estetica.exception.PagamentoPendenteException;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.ClinicaTenant;
import com.estetica.model.Lojista;
import com.estetica.model.Role;
import com.estetica.model.Usuario;
import com.estetica.repository.ClinicaTenantRepository;
import com.estetica.repository.LojistaRepository;
import com.estetica.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final LojistaRepository lojistaRepository;
    private final ClinicaTenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TenantResolverService tenantResolverService;
    private final MercadoPagoService mercadoPagoService;
    private final HttpServletRequest httpServletRequest;

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

        ClinicaTenant t = usuario.getTenant();
        return new AuthResponse(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefoneWhatsApp(),
                usuario.getRole(),
                usuario.getPrimeiroAcesso(),
                t != null ? t.getSlug() : null,
                t != null ? t.getNomeEmpresa() : null,
                t != null ? t.getLogoUrl() : null
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
                admin.getPrimeiroAcesso(),
                null,
                null,
                null
        );
    }

    public AuthResponse autenticar(LoginRequest request) {
        String iden = request.getIdentificador();
        if (iden.isBlank()) {
            throw new BadCredentialsException("Informe seu login, WhatsApp ou e-mail para acessar.");
        }

        String slugAmbiente = extrairSlugDoAmbiente(request);

        // =========================================================================
        // 1. TENTA AUTENTICAR COMO LOJISTA (TABELA DEDICADA tb_lojista)
        // =========================================================================
        Lojista lojista = lojistaRepository.findByLoginIgnoreCase(iden)
                .or(() -> lojistaRepository.findByEmailIgnoreCase(iden))
                .orElse(null);

        if (lojista == null) {
            String digits = iden.replaceAll("[^0-9]", "");
            if (digits.length() >= 8) {
                lojista = lojistaRepository.findByTelefoneWhatsApp(digits)
                        .or(() -> lojistaRepository.findByTelefoneWhatsApp(iden))
                        .orElse(null);
            }
        }

        if (lojista != null) {
            return autenticarLojista(lojista, request, slugAmbiente);
        }

        // =========================================================================
        // 2. TENTA AUTENTICAR COMO USUÁRIO COMUM (tb_usuario: ADMIN MASTER, ESPECIALISTA, CLIENTE)
        // =========================================================================
        Usuario usuario = usuarioRepository.findByLoginIgnoreCase(iden).orElse(null);

        if (usuario == null) {
            usuario = usuarioRepository.findByEmail(iden.toLowerCase().trim()).orElse(null);
        }

        if (usuario == null) {
            String digits = iden.replaceAll("[^0-9]", "");
            if (digits.length() >= 8) {
                usuario = usuarioRepository.findByTelefoneWhatsApp(digits)
                        .or(() -> usuarioRepository.findByTelefoneWhatsApp(iden))
                        .orElse(null);
            }
        }

        if (usuario == null) {
            throw new BadCredentialsException("Login ou usuário inválido.");
        }

        return autenticarUsuario(usuario, request, slugAmbiente);
    }

    private AuthResponse autenticarLojista(Lojista lojista, LoginRequest request, String slugAmbiente) {
        String lojistaSlug = lojista.getSlug();

        // REGRA DE ISOLAMENTO DE LINK / DOMÍNIO:
        // O lojista só pode fazer login no seu próprio link/subdomínio!
        // Caso tente logar no link principal ou em outro link, retorna erro genérico conforme solicitado.
        if (slugAmbiente != null) {
            if ("estetica".equalsIgnoreCase(slugAmbiente) || !slugAmbiente.equalsIgnoreCase(lojistaSlug)) {
                throw new BadCredentialsException("Login ou usuário inválido.");
            }
        }

        if (!passwordEncoder.matches(request.senha(), lojista.getSenhaHash())) {
            throw new BadCredentialsException("Login ou usuário inválido.");
        }

        // Validação de Pagamento PIX do Lojista
        if (!"APROVADO".equalsIgnoreCase(lojista.getStatusPagamento()) || Boolean.FALSE.equals(lojista.getAtivo())) {
            // Se o PIX não estava gerado, gera sob demanda
            if (lojista.getPixQrCodeBase64() == null || lojista.getPixCopiaCola() == null) {
                try {
                    ClinicaTenant tenant = tenantRepository.findBySlugIgnoreCase(lojistaSlug).orElse(null);
                    if (tenant != null) {
                        Map<String, Object> mp = mercadoPagoService.criarPagamentoPix(tenant, lojista, lojista.getValorAdesao() != null ? lojista.getValorAdesao() : new BigDecimal("149.90"));
                        if (mp != null) {
                            lojista.setMercadoPagoPaymentId(String.valueOf(mp.get("id")));
                            Map<String, Object> poi = (Map<String, Object>) mp.get("point_of_interaction");
                            if (poi != null && poi.get("transaction_data") != null) {
                                Map<String, Object> td = (Map<String, Object>) poi.get("transaction_data");
                                lojista.setPixCopiaCola((String) td.get("qr_code"));
                                lojista.setPixQrCodeBase64((String) td.get("qr_code_base64"));
                                lojista = lojistaRepository.save(lojista);
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }

            throw new PagamentoPendenteException(
                    "O seu acesso está aguardando a confirmação do pagamento PIX de ativação (R$ 149,90).",
                    lojista.getMercadoPagoPaymentId(),
                    lojista.getPixCopiaCola(),
                    lojista.getPixQrCodeBase64(),
                    lojista.getValorAdesao() != null ? lojista.getValorAdesao() : new BigDecimal("149.90")
            );
        }

        String token = jwtService.gerarToken(lojista);

        ClinicaTenant tenantLojista = tenantRepository.findBySlugIgnoreCase(lojista.getSlug()).orElse(null);
        String nomeEmp = tenantLojista != null ? tenantLojista.getNomeEmpresa() : (lojista.getNomeEmpresa() != null ? lojista.getNomeEmpresa() : lojista.getNomeResponsavel());
        String logo = tenantLojista != null ? tenantLojista.getLogoUrl() : lojista.getLogoUrl();

        return new AuthResponse(
                token,
                lojista.getId(),
                lojista.getNomeResponsavel(),
                lojista.getEmail(),
                lojista.getTelefoneWhatsApp(),
                Role.ROLE_ADMIN,
                false,
                lojista.getSlug(),
                nomeEmp,
                logo
        );
    }

    private AuthResponse autenticarUsuario(Usuario usuario, LoginRequest request, String slugAmbiente) {
        boolean isMasterAdmin = "admin@logistadigital.com.br".equalsIgnoreCase(usuario.getEmail()) || (usuario.getTenant() == null && usuario.getRole() == Role.ROLE_ADMIN);

        // REGRA DE ISOLAMENTO DE LINK / DOMÍNIO PARA USUÁRIO COMUM:
        if (isMasterAdmin) {
            // Administrador Master: só acessa pelo link principal (estetica)
            if (slugAmbiente != null && !"estetica".equalsIgnoreCase(slugAmbiente)) {
                throw new BadCredentialsException("Login ou usuário inválido.");
            }
        } else {
            // Especialista ou Cliente de uma clínica:
            ClinicaTenant tenant = usuario.getTenant();
            String userSlug = tenant != null ? tenant.getSlug() : null;

            if (slugAmbiente != null) {
                if ("estetica".equalsIgnoreCase(slugAmbiente) || (userSlug != null && !slugAmbiente.equalsIgnoreCase(userSlug))) {
                    throw new BadCredentialsException("Login ou usuário inválido.");
                }
            }
        }

        // Clientes: login exclusivo via Telefone / WhatsApp
        if (usuario.getRole() == Role.ROLE_CLIENTE) {
            String digits = request.getIdentificador().replaceAll("[^0-9]", "");
            String userDigits = usuario.getTelefoneWhatsApp() != null ? usuario.getTelefoneWhatsApp().replaceAll("[^0-9]", "") : "";
            if (digits.length() < 8 || !userDigits.endsWith(digits.substring(Math.max(0, digits.length() - 8)))) {
                throw new BadCredentialsException("Para clientes/pacientes, o acesso é realizado exclusivamente pelo número do WhatsApp.");
            }
        }

        // Se estiver no primeiro acesso ou sem senha definida
        if (Boolean.TRUE.equals(usuario.getPrimeiroAcesso()) || usuario.getSenhaHash() == null) {
            throw new RegraNegocioException("Primeiro acesso detectado! Por favor, use a opção 'Primeiro Acesso' para definir sua senha.");
        }

        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new BadCredentialsException("Login ou usuário inválido.");
        }

        ClinicaTenant tenant = usuario.getTenant();
        if (tenant != null && Boolean.FALSE.equals(tenant.getAtivo())) {
            throw new RegraNegocioException("Este estabelecimento está temporariamente desativado. Entre em contato com o suporte.");
        }

        if (!usuario.isEnabled()) {
            throw new RegraNegocioException("Usuário inativo. Entre em contato com o responsável.");
        }

        String token = jwtService.gerarToken(usuario);

        ClinicaTenant t = usuario.getTenant();
        return new AuthResponse(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefoneWhatsApp(),
                usuario.getRole(),
                usuario.getPrimeiroAcesso(),
                t != null ? t.getSlug() : null,
                t != null ? t.getNomeEmpresa() : null,
                t != null ? t.getLogoUrl() : null
        );
    }

    private String extrairSlugDoAmbiente(LoginRequest request) {
        String host = request.host();
        if (host == null || host.isBlank()) {
            host = request.origin();
        }
        if ((host == null || host.isBlank()) && httpServletRequest != null) {
            host = httpServletRequest.getHeader("X-Forwarded-Host");
            if (host == null || host.isBlank()) {
                host = httpServletRequest.getHeader("Host");
            }
            if (host == null || host.isBlank()) {
                host = httpServletRequest.getHeader("Origin");
            }
        }
        if (host == null) return null;

        host = host.toLowerCase().trim()
                .replace("https://", "")
                .replace("http://", "");

        int slashIdx = host.indexOf('/');
        if (slashIdx >= 0) host = host.substring(0, slashIdx);

        int colonIdx = host.indexOf(':');
        if (colonIdx >= 0) host = host.substring(0, colonIdx);

        if (host.endsWith(".logistadigital.com.br")) {
            String sub = host.substring(0, host.indexOf(".logistadigital.com.br"));
            return sub.isBlank() ? "estetica" : sub;
        }

        if (host.equals("logistadigital.com.br") || host.equals("estetica.local")) {
            return "estetica";
        }

        // Se for localhost ou IP de desenvolvimento direto, não restringe ou assume estetica
        if (host.equals("localhost") || host.equals("127.0.0.1") || host.matches("^\\d+\\.\\d+\\.\\d+\\.\\d+$")) {
            return null; // Em ambiente local sem subdomínio, não bloqueia por domínio
        }

        return host;
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
            throw new RegraNegocioException("Usuário inativo. Entre em contato com o responsável.");
        }

        usuario.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        usuario.setPrimeiroAcesso(false);
        usuario = usuarioRepository.save(usuario);

        String token = jwtService.gerarToken(usuario);

        ClinicaTenant t = usuario.getTenant();
        return new AuthResponse(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefoneWhatsApp(),
                usuario.getRole(),
                false,
                t != null ? t.getSlug() : null,
                t != null ? t.getNomeEmpresa() : null,
                t != null ? t.getLogoUrl() : null
        );
    }
}

