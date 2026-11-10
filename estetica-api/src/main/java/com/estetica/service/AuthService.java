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
import java.time.LocalDateTime;
import java.util.List;
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
        String slugReq = request.slug();
        if (slugReq == null || slugReq.isBlank()) {
            slugReq = tenantResolverService.extrairSlugDaRequisicaoHttp();
        }
        ClinicaTenant tenantAlvo = tenantResolverService.resolverTenantPorSlugOuAutenticado(slugReq);
        Long tenantId = tenantAlvo != null ? tenantAlvo.getId() : null;

        String telefone = request.telefoneWhatsApp().replaceAll("[^0-9]", "");
        boolean telExiste = (tenantId != null)
                ? usuarioRepository.existsByTenantIdAndTelefoneWhatsApp(tenantId, telefone)
                : usuarioRepository.existsByTelefoneWhatsApp(telefone);
        if (telExiste) {
            throw new RegraNegocioException("O WhatsApp informado já está cadastrado neste estabelecimento.");
        }

        String email = (request.email() != null && !request.email().isBlank()) 
                ? request.email().toLowerCase().trim() 
                : null;

        if (email != null) {
            boolean emailExiste = (tenantId != null)
                    ? usuarioRepository.existsByTenantIdAndEmailIgnoreCase(tenantId, email)
                    : usuarioRepository.existsByEmail(email);
            if (emailExiste) {
                throw new RegraNegocioException("O e-mail informado já está cadastrado neste estabelecimento.");
            }
        }

        Usuario usuario = Usuario.builder()
                .nome(request.nome().trim())
                .email(email)
                .telefoneWhatsApp(telefone)
                .senhaHash(passwordEncoder.encode(request.senha()))
                .role(Role.ROLE_CLIENTE)
                .tenant(tenantAlvo)
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
                t != null ? t.getLogoUrl() : null,
                t != null && t.getSetor() != null ? t.getSetor().name() : null
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
        if (slugAmbiente == null || slugAmbiente.isBlank()) {
            slugAmbiente = "estetica";
        }
        slugAmbiente = slugAmbiente.toLowerCase().trim();

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
        // 2. TENTA AUTENTICAR COMO USUÁRIO (tb_usuario: ADMIN MASTER, ESPECIALISTA)
        // =========================================================================
        final String targetSlug = slugAmbiente;
        Usuario usuario = selecionarUsuarioDoAmbiente(usuarioRepository.findAllByLoginIgnoreCase(iden), targetSlug);

        if (usuario == null) {
            usuario = selecionarUsuarioDoAmbiente(usuarioRepository.findAllByEmailIgnoreCase(iden.trim()), targetSlug);
        }

        if (usuario == null) {
            String digits = iden.replaceAll("[^0-9]", "");
            if (digits.length() >= 8) {
                usuario = selecionarUsuarioDoAmbiente(usuarioRepository.findAllByTelefoneWhatsApp(digits), targetSlug);
                if (usuario == null) {
                    usuario = selecionarUsuarioDoAmbiente(usuarioRepository.findAllByTelefoneWhatsApp(iden), targetSlug);
                }
            }
        }

        if (usuario == null) {
            throw new BadCredentialsException("Login ou usuário inválido.");
        }

        return autenticarUsuario(usuario, request, slugAmbiente);
    }

    private Usuario selecionarUsuarioDoAmbiente(List<Usuario> candidatos, String slugAmbiente) {
        if (candidatos == null || candidatos.isEmpty()) return null;
        return candidatos.stream()
                .filter(u -> {
                    boolean isMaster = "admin@logistadigital.com.br".equalsIgnoreCase(u.getEmail())
                            || (u.getTenant() == null && u.getRole() == Role.ROLE_ADMIN);
                    if (isMaster) {
                        return "estetica".equalsIgnoreCase(slugAmbiente);
                    }
                    return u.getTenant() != null && u.getTenant().getSlug() != null
                            && slugAmbiente.equalsIgnoreCase(u.getTenant().getSlug().trim());
                })
                .findFirst()
                .orElse(null);
    }

    private AuthResponse autenticarLojista(Lojista lojista, LoginRequest request, String slugAmbiente) {
        String lojistaSlug = lojista.getSlug();

        // REGRA DE ISOLAMENTO DE LINK / DOMÍNIO:
        // O lojista só pode fazer login no seu próprio link/subdomínio!
        // Caso tente logar no link principal ou em outro link, é estritamente barrado.
        if (lojistaSlug == null || !slugAmbiente.equalsIgnoreCase(lojistaSlug.trim())) {
            throw new BadCredentialsException("Login ou usuário inválido.");
        }

        if (!passwordEncoder.matches(request.senha(), lojista.getSenhaHash())) {
            throw new BadCredentialsException("Login ou usuário inválido.");
        }

        // Validação de Pagamento PIX Inicial OU Assinatura Mensal Vencida
        LocalDateTime agora = LocalDateTime.now();
        boolean pendenteInicial = !"APROVADO".equalsIgnoreCase(lojista.getStatusPagamento()) || Boolean.FALSE.equals(lojista.getAtivo());
        boolean assinaturaVencida = !pendenteInicial && lojista.getDataVencimento() != null && agora.isAfter(lojista.getDataVencimento());

        if (pendenteInicial || assinaturaVencida) {
            String payIdAtual = assinaturaVencida ? lojista.getRenovacaoPaymentId() : lojista.getMercadoPagoPaymentId();
            String pixCopiaColaAtual = assinaturaVencida ? lojista.getRenovacaoPixCopiaCola() : lojista.getPixCopiaCola();
            String pixQrAtual = assinaturaVencida ? lojista.getRenovacaoPixQrCodeBase64() : lojista.getPixQrCodeBase64();
            boolean precisaGerarNovoPix = (pixQrAtual == null || pixCopiaColaAtual == null)
                    || (assinaturaVencida && lojista.getRenovacaoCriadaEm() != null && lojista.getRenovacaoCriadaEm().isBefore(agora.minusMinutes(25)));

            if (precisaGerarNovoPix) {
                try {
                    ClinicaTenant tenant = tenantRepository.findBySlugIgnoreCase(lojistaSlug).orElse(null);
                    if (tenant != null) {
                        BigDecimal valorCobrar = lojista.getValorAdesao() != null ? lojista.getValorAdesao() : new BigDecimal("149.90");
                        String desc = assinaturaVencida
                                ? "Renovação Mensal da Assinatura - " + lojista.getNomeEmpresa()
                                : "Ativação Sistema Lojista Digital - " + lojista.getNomeEmpresa();
                        Map<String, Object> mp = mercadoPagoService.criarPagamentoPix(tenant, lojista, valorCobrar, desc);
                        if (mp != null) {
                            payIdAtual = String.valueOf(mp.get("id"));
                            Map<String, Object> poi = (Map<String, Object>) mp.get("point_of_interaction");
                            if (poi != null && poi.get("transaction_data") != null) {
                                Map<String, Object> td = (Map<String, Object>) poi.get("transaction_data");
                                pixCopiaColaAtual = (String) td.get("qr_code");
                                pixQrAtual = (String) td.get("qr_code_base64");
                                if (assinaturaVencida) {
                                    lojista.setRenovacaoPaymentId(payIdAtual);
                                    lojista.setRenovacaoPixCopiaCola(pixCopiaColaAtual);
                                    lojista.setRenovacaoPixQrCodeBase64(pixQrAtual);
                                    lojista.setRenovacaoCriadaEm(agora);
                                } else {
                                    lojista.setMercadoPagoPaymentId(payIdAtual);
                                    lojista.setPixCopiaCola(pixCopiaColaAtual);
                                    lojista.setPixQrCodeBase64(pixQrAtual);
                                }
                                lojista = lojistaRepository.save(lojista);
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }

            String msgPendencia = assinaturaVencida
                    ? "Sua assinatura mensal venceu. Realize o pagamento PIX de renovação (R$ 149,90) para reativar seu painel."
                    : "O seu acesso está aguardando a confirmação do pagamento PIX de ativação (R$ 149,90).";

            throw new PagamentoPendenteException(
                    msgPendencia,
                    payIdAtual,
                    pixCopiaColaAtual,
                    pixQrAtual,
                    lojista.getValorAdesao() != null ? lojista.getValorAdesao() : new BigDecimal("149.90")
            );
        }

        String token = jwtService.gerarToken(lojista);

        ClinicaTenant tenantLojista = tenantRepository.findBySlugIgnoreCase(lojista.getSlug()).orElse(null);
        String nomeEmp = tenantLojista != null ? tenantLojista.getNomeEmpresa() : (lojista.getNomeEmpresa() != null ? lojista.getNomeEmpresa() : lojista.getNomeResponsavel());
        String logo = tenantLojista != null ? tenantLojista.getLogoUrl() : lojista.getLogoUrl();

        String setorLojista = lojista.getSetor() != null ? lojista.getSetor().name() : (tenantLojista != null && tenantLojista.getSetor() != null ? tenantLojista.getSetor().name() : "CLINICA_ESTETICA");

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
                logo,
                setorLojista
        );
    }

    private AuthResponse autenticarUsuario(Usuario usuario, LoginRequest request, String slugAmbiente) {
        boolean isMasterAdmin = "admin@logistadigital.com.br".equalsIgnoreCase(usuario.getEmail()) 
                || (usuario.getTenant() == null && usuario.getRole() == Role.ROLE_ADMIN);

        ClinicaTenant tenant = usuario.getTenant();
        String userSlug = tenant != null ? tenant.getSlug() : null;

        // REGRA DE ISOLAMENTO DE LINK / DOMÍNIO PARA USUÁRIO COMUM:
        if (isMasterAdmin) {
            // Administrador Master: só acessa pelo link principal (estetica)
            if (!"estetica".equalsIgnoreCase(slugAmbiente)) {
                throw new BadCredentialsException("Login ou usuário inválido.");
            }
        } else {
            // Especialista ou Cliente de uma clínica:
            // SÓ PODE ACESSAR NO LINK DA PRÓPRIA CLÍNICA!
            if (userSlug == null || !slugAmbiente.equalsIgnoreCase(userSlug.trim())) {
                throw new BadCredentialsException("Login ou usuário inválido.");
            }
        }

        if (usuario.getRole() == Role.ROLE_CLIENTE || "SEM_LOGIN".equals(usuario.getSenhaHash())) {
            throw new BadCredentialsException("Login exclusivo para Administradores e Especialistas. Clientes agendam diretamente pelo catálogo.");
        }

        // Se estiver no primeiro acesso ou sem senha definida
        if (Boolean.TRUE.equals(usuario.getPrimeiroAcesso()) || usuario.getSenhaHash() == null) {
            throw new RegraNegocioException("Primeiro acesso detectado! Por favor, use a opção 'Primeiro Acesso' para definir sua senha.");
        }

        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new BadCredentialsException("Login ou usuário inválido.");
        }

        if (tenant != null && Boolean.FALSE.equals(tenant.getAtivo())) {
            throw new RegraNegocioException("Este estabelecimento está temporariamente desativado. Entre em contato com o suporte.");
        }

        if (!isMasterAdmin && tenant != null) {
            Lojista lojistaDono = lojistaRepository.findBySlugIgnoreCase(tenant.getSlug()).orElse(null);
            LocalDateTime venc = lojistaDono != null && lojistaDono.getDataVencimento() != null
                    ? lojistaDono.getDataVencimento()
                    : tenant.getDataVencimento();
            if (venc != null && LocalDateTime.now().isAfter(venc)) {
                throw new RegraNegocioException("A assinatura deste estabelecimento está vencida. Solicite ao administrador a renovação no painel.");
            }
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
                t != null ? t.getLogoUrl() : null,
                t != null && t.getSetor() != null ? t.getSetor().name() : null
        );
    }

    private String extrairSlugDoAmbiente(LoginRequest request) {
        if (request != null && request.slug() != null && !request.slug().isBlank()) {
            return request.slug().toLowerCase().trim();
        }

        String host = request != null ? request.host() : null;
        if (host == null || host.isBlank()) {
            host = request != null ? request.origin() : null;
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
        if (host == null || host.isBlank()) return "estetica";

        host = host.toLowerCase().trim()
                .replace("https://", "")
                .replace("http://", "");

        int slashIdx = host.indexOf('/');
        if (slashIdx >= 0) host = host.substring(0, slashIdx);

        int colonIdx = host.indexOf(':');
        if (colonIdx >= 0) host = host.substring(0, colonIdx);

        if (host.endsWith(".logistadigital.com.br")) {
            String sub = host.substring(0, host.indexOf(".logistadigital.com.br")).trim();
            return sub.isBlank() ? "estetica" : sub;
        }

        if (host.equals("logistadigital.com.br") || host.equals("estetica.local")) {
            return "estetica";
        }

        if (!host.equals("localhost") && !host.equals("127.0.0.1") && !host.matches("^\\d+\\.\\d+\\.\\d+\\.\\d+$")) {
            return host;
        }

        return "estetica";
    }

    // =========================================================================
    // PRIMEIRO ACESSO: DEFINIÇÃO DE SENHA PARA ESPECIALISTAS
    // =========================================================================
    @Transactional(readOnly = true)
    public VerificarPrimeiroAcessoResponse verificarPrimeiroAcesso(String telefone) {
        String digits = telefone != null ? telefone.replaceAll("[^0-9]", "") : "";
        if (digits.isBlank()) {
            return new VerificarPrimeiroAcessoResponse(false, "", false);
        }

        String slugAmbiente = extrairSlugDoAmbiente(null);
        Usuario usuario = selecionarUsuarioDoAmbiente(usuarioRepository.findAllByTelefoneWhatsApp(digits), slugAmbiente);
        if (usuario == null && telefone != null) {
            usuario = selecionarUsuarioDoAmbiente(usuarioRepository.findAllByTelefoneWhatsApp(telefone), slugAmbiente);
        }

        if (usuario == null || usuario.getRole() == Role.ROLE_CLIENTE) {
            return new VerificarPrimeiroAcessoResponse(false, "", false);
        }

        boolean precisaPrimeiroAcesso = Boolean.TRUE.equals(usuario.getPrimeiroAcesso()) || usuario.getSenhaHash() == null;
        return new VerificarPrimeiroAcessoResponse(true, usuario.getNome(), precisaPrimeiroAcesso);
    }

    @Transactional
    public AuthResponse primeiroAcesso(PrimeiroAcessoRequest request) {
        String digits = request.telefoneWhatsApp().replaceAll("[^0-9]", "");
        String slugAmbiente = extrairSlugDoAmbiente(null);
        Usuario usuario = selecionarUsuarioDoAmbiente(usuarioRepository.findAllByTelefoneWhatsApp(digits), slugAmbiente);
        if (usuario == null) {
            usuario = selecionarUsuarioDoAmbiente(usuarioRepository.findAllByTelefoneWhatsApp(request.telefoneWhatsApp()), slugAmbiente);
        }
        if (usuario == null || usuario.getRole() == Role.ROLE_CLIENTE) {
            throw new RegraNegocioException("Nenhum especialista cadastrado encontrado neste link com o WhatsApp: " + request.telefoneWhatsApp());
        }

        if (!usuario.isEnabled()) {
            throw new RegraNegocioException("Usuário inativo. Entre em contato com o responsável.");
        }

        if (!Boolean.TRUE.equals(usuario.getPrimeiroAcesso()) && usuario.getSenhaHash() != null) {
            throw new RegraNegocioException("Sua senha já foi definida anteriormente. Use o login normal ou peça a redefinição ao administrador.");
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
                t != null ? t.getLogoUrl() : null,
                t != null && t.getSetor() != null ? t.getSetor().name() : null
        );
    }
}

