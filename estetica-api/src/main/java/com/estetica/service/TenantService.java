package com.estetica.service;

import com.estetica.config.JwtService;
import com.estetica.dto.AuthDTOs.UsuarioDTO;
import com.estetica.dto.TenantDTOs.*;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.ClinicaTenant;
import com.estetica.model.Role;
import com.estetica.model.Usuario;
import com.estetica.repository.ClinicaTenantRepository;
import com.estetica.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final ClinicaTenantRepository tenantRepository;
    private final UsuarioRepository usuarioRepository;
    private final com.estetica.repository.LojistaRepository lojistaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TenantResolverService tenantResolverService;
    private final MercadoPagoService mercadoPagoService;

    private static final BigDecimal VALOR_ADESAO_PIX = new BigDecimal("149.90");

    private static final Set<String> SLUGS_RESERVADOS = Set.of(
            "admin", "api", "www", "app", "dashboard", "mail", "portal", "estetica", "teste"
    );

    @Transactional
    public CadastroLojistaResponse cadastrarLojista(CadastroLojistaRequest request) {
        String cleanSlug = normalizarSlug(request.slug());

        if (cleanSlug.length() < 3) {
            throw new RegraNegocioException("O link exclusivo deve ter pelo menos 3 caracteres.");
        }

        if (SLUGS_RESERVADOS.contains(cleanSlug)) {
            throw new RegraNegocioException("Este link exclusivo é reservado pelo sistema. Por favor, escolha outro.");
        }

        if (tenantRepository.existsBySlugIgnoreCase(cleanSlug) || lojistaRepository.existsBySlugIgnoreCase(cleanSlug)) {
            throw new RegraNegocioException("O link https://" + cleanSlug + ".logistadigital.com.br/ já está em uso por outro parceiro.");
        }

        String email = request.email().toLowerCase().trim();
        if (usuarioRepository.existsByEmail(email) || lojistaRepository.existsByEmailIgnoreCase(email)) {
            throw new RegraNegocioException("Já existe um cadastro com o e-mail: " + email);
        }

        // Validação do Usuário / Login de Administrador (campo livre)
        String customLogin = (request.usuarioLogin() != null && !request.usuarioLogin().isBlank())
                ? request.usuarioLogin().trim().toLowerCase()
                : null;

        if (customLogin != null) {
            if (usuarioRepository.existsByLoginIgnoreCase(customLogin) || lojistaRepository.existsByLoginIgnoreCase(customLogin)) {
                throw new RegraNegocioException("O nome de usuário '" + customLogin + "' já está em uso. Por favor, escolha outro.");
            }
        }

        String corPrimaria = (request.corPrimaria() != null && !request.corPrimaria().isBlank())
                ? request.corPrimaria().trim() : "#e11d48";
        String corSecundaria = (request.corSecundaria() != null && !request.corSecundaria().isBlank())
                ? request.corSecundaria().trim() : "#f43f5e";
        String linkPersonalizado = "https://" + cleanSlug + ".logistadigital.com.br/";
        String linkLogin = "https://" + cleanSlug + ".logistadigital.com.br/login";

        // 1. Salva o Lojista na tabela dedicada tb_lojista (separado de usuários comuns)
        com.estetica.model.Lojista lojista = com.estetica.model.Lojista.builder()
                .nomeEmpresa(request.nomeEmpresa().trim())
                .slug(cleanSlug)
                .linkPersonalizado(linkPersonalizado)
                .linkLogin(linkLogin)
                .nomeResponsavel(request.nomeResponsavel().trim())
                .login(customLogin)
                .email(email)
                .telefoneWhatsApp(request.telefoneWhatsApp().replaceAll("[^0-9]", ""))
                .senhaHash(passwordEncoder.encode(request.senha()))
                .logoUrl(request.logoUrl() != null && !request.logoUrl().isBlank() ? request.logoUrl().trim() : null)
                .corPrimaria(corPrimaria)
                .corSecundaria(corSecundaria)
                .statusPagamento("PENDENTE")
                .valorAdesao(VALOR_ADESAO_PIX)
                .ativo(false) // Liberado após confirmação do PIX
                .build();
        lojista = lojistaRepository.save(lojista);

        // 2. Salva a Clínica / Tenant da Loja vinculada ao Lojista
        ClinicaTenant tenant = ClinicaTenant.builder()
                .nomeEmpresa(request.nomeEmpresa().trim())
                .slug(cleanSlug)
                .linkPersonalizado(linkPersonalizado)
                .logoUrl(request.logoUrl() != null && !request.logoUrl().isBlank() ? request.logoUrl().trim() : null)
                .corPrimaria(corPrimaria)
                .corSecundaria(corSecundaria)
                .lojista(lojista)
                .telefoneWhatsApp(request.telefoneWhatsApp().replaceAll("[^0-9]", ""))
                .statusPagamento("PENDENTE")
                .valorAdesao(VALOR_ADESAO_PIX)
                .ativo(false) // Só ativado após confirmação do PIX
                .build();
        tenant = tenantRepository.save(tenant);

        // 3. Integração com Mercado Pago para Gerar Cobrança Pix de R$ 149,90
        String paymentId = null;
        String qrCode = null;
        String qrCodeBase64 = null;

        try {
            Map<String, Object> mpResponse = mercadoPagoService.criarPagamentoPix(tenant, lojista, VALOR_ADESAO_PIX);
            if (mpResponse != null) {
                paymentId = String.valueOf(mpResponse.get("id"));
                tenant.setMercadoPagoPaymentId(paymentId);
                lojista.setMercadoPagoPaymentId(paymentId);

                Map<String, Object> poi = (Map<String, Object>) mpResponse.get("point_of_interaction");
                if (poi != null && poi.get("transaction_data") != null) {
                    Map<String, Object> td = (Map<String, Object>) poi.get("transaction_data");
                    qrCode = (String) td.get("qr_code");
                    qrCodeBase64 = (String) td.get("qr_code_base64");
                    tenant.setPixCopiaCola(qrCode);
                    tenant.setPixQrCodeBase64(qrCodeBase64);
                    lojista.setPixCopiaCola(qrCode);
                    lojista.setPixQrCodeBase64(qrCodeBase64);
                }
                tenant = tenantRepository.save(tenant);
                lojista = lojistaRepository.save(lojista);
            }
        } catch (Exception ex) {
            log.error("[TenantService] Erro ao gerar PIX de adesão no Mercado Pago: {}", ex.getMessage(), ex);
            throw new RegraNegocioException("Erro ao gerar QR Code PIX de adesão no Mercado Pago: " + ex.getMessage());
        }

        UsuarioDTO lojistaDTO = new UsuarioDTO(
                lojista.getId(),
                lojista.getNomeResponsavel(),
                lojista.getEmail(),
                lojista.getTelefoneWhatsApp(),
                Role.ROLE_ADMIN,
                lojista.getAtivo(),
                false
        );
        TenantPublicDTO tenantDTO = toPublicDTO(tenant);

        return new CadastroLojistaResponse(
                paymentId,
                qrCode,
                qrCodeBase64,
                VALOR_ADESAO_PIX,
                "PENDENTE",
                linkPersonalizado,
                tenantDTO,
                lojistaDTO,
                null // Token só é emitido após aprovação do pagamento!
        );
    }

    /**
     * Consulta o status do pagamento no Mercado Pago.
     * Se aprovado, libera o acesso imediatamente e gera o token de autenticação.
     */
    @Transactional
    public StatusPagamentoResponse verificarStatusPagamento(String paymentId) {
        if (paymentId == null || paymentId.isBlank()) {
            throw new RegraNegocioException("ID de pagamento não informado.");
        }

        Map<String, Object> mpResponse = mercadoPagoService.consultarStatusPagamento(paymentId);
        String status = (String) mpResponse.get("status");
        boolean aprovado = "approved".equalsIgnoreCase(status);

        com.estetica.model.Lojista lojista = lojistaRepository.findByMercadoPagoPaymentId(paymentId).orElse(null);
        ClinicaTenant tenant = tenantRepository.findByMercadoPagoPaymentId(paymentId).orElse(null);

        if (tenant == null && lojista != null) {
            tenant = tenantRepository.findBySlugIgnoreCase(lojista.getSlug()).orElse(null);
        }

        if (tenant == null && lojista == null) {
            log.warn("[TenantService] Lojista e Tenant não localizados para o pagamento {}", paymentId);
            return new StatusPagamentoResponse(status != null ? status : "pending", false, null, null, null, null, null);
        }

        String link = tenant != null ? tenant.getLinkPersonalizado() : (lojista != null ? lojista.getLinkPersonalizado() : null);
        String slug = tenant != null ? tenant.getSlug() : (lojista != null ? lojista.getSlug() : null);

        if (aprovado) {
            if (tenant != null && (!Boolean.TRUE.equals(tenant.getAtivo()) || !"APROVADO".equalsIgnoreCase(tenant.getStatusPagamento()))) {
                log.info("[TenantService] Pagamento aprovado para a loja: {}. Ativando tenant e liberando acesso!", tenant.getNomeEmpresa());
                tenant.setAtivo(true);
                tenant.setStatusPagamento("APROVADO");
                tenant = tenantRepository.save(tenant);
            }

            if (lojista != null && (!Boolean.TRUE.equals(lojista.getAtivo()) || !"APROVADO".equalsIgnoreCase(lojista.getStatusPagamento()))) {
                lojista.setAtivo(true);
                lojista.setStatusPagamento("APROVADO");
                lojista.setDataPagamento(java.time.LocalDateTime.now());
                lojista = lojistaRepository.save(lojista);
            }

            String token = null;
            if (lojista != null) {
                token = jwtService.gerarToken(lojista);
            } else if (tenant != null && tenant.getAdminUsuario() != null) {
                token = jwtService.gerarToken(tenant.getAdminUsuario());
            }

            UsuarioDTO adminDTO = null;
            if (lojista != null) {
                adminDTO = new UsuarioDTO(lojista.getId(), lojista.getNomeResponsavel(), lojista.getEmail(), lojista.getTelefoneWhatsApp(), Role.ROLE_ADMIN, true, false);
            } else if (tenant != null && tenant.getAdminUsuario() != null) {
                adminDTO = toUsuarioDTO(tenant.getAdminUsuario());
            }

            return new StatusPagamentoResponse(
                    "approved",
                    true,
                    token,
                    link,
                    slug,
                    tenant != null ? toPublicDTO(tenant) : null,
                    adminDTO
            );
        }

        UsuarioDTO adminDTO = null;
        if (lojista != null) {
            adminDTO = new UsuarioDTO(lojista.getId(), lojista.getNomeResponsavel(), lojista.getEmail(), lojista.getTelefoneWhatsApp(), Role.ROLE_ADMIN, lojista.getAtivo(), false);
        } else if (tenant != null && tenant.getAdminUsuario() != null) {
            adminDTO = toUsuarioDTO(tenant.getAdminUsuario());
        }

        return new StatusPagamentoResponse(
                status != null ? status : "pending",
                false,
                null,
                link,
                slug,
                tenant != null ? toPublicDTO(tenant) : null,
                adminDTO
        );
    }

    @Transactional(readOnly = true)
    public TenantPublicDTO buscarPorSlug(String slug) {
        String cleanSlug = normalizarSlug(slug);
        ClinicaTenant tenant = tenantRepository.findBySlugIgnoreCase(cleanSlug)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Loja ou clínica parceira não encontrada com o link: " + slug));
        return toPublicDTO(tenant);
    }

    @Transactional(readOnly = true)
    public boolean verificarDisponibilidadeSlug(String slug) {
        String cleanSlug = normalizarSlug(slug);
        if (cleanSlug.length() < 3 || SLUGS_RESERVADOS.contains(cleanSlug)) {
            return false;
        }
        return !tenantRepository.existsBySlugIgnoreCase(cleanSlug);
    }

    private String normalizarSlug(String slug) {
        if (slug == null) return "";
        return slug.toLowerCase().trim()
                .replace("https://", "")
                .replace("http://", "")
                .replace(".logistadigital.com.br", "")
                .replaceAll("[^a-z0-9-]", "");
    }

    public TenantPublicDTO toDTO(ClinicaTenant t) {
        return toPublicDTO(t);
    }

    private TenantPublicDTO toPublicDTO(ClinicaTenant t) {
        return new TenantPublicDTO(
                t.getId(),
                t.getNomeEmpresa(),
                t.getSlug(),
                t.getLinkPersonalizado(),
                t.getLogoUrl(),
                t.getCorPrimaria(),
                t.getCorSecundaria(),
                t.getTelefoneWhatsApp(),
                t.getBannerTag() != null ? t.getBannerTag() : "✨ Cuidado & Alta Tecnologia",
                t.getBannerTitulo() != null ? t.getBannerTitulo() : "Realce sua melhor versão com tratamentos exclusivos.",
                t.getBannerSubtitulo() != null ? t.getBannerSubtitulo() : "Protocolos personalizados, equipamentos de última geração e especialistas dedicados ao seu bem-estar e autoestima.",
                t.getBannerBotaoTexto() != null ? t.getBannerBotaoTexto() : "Agendamento Online",
                t.getStatusPagamento() != null ? t.getStatusPagamento() : "PENDENTE",
                t.getAtivo()
        );
    }

    private UsuarioDTO toUsuarioDTO(Usuario u) {
        return new UsuarioDTO(
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getTelefoneWhatsApp(),
                u.getRole(),
                u.getAtivo(),
                u.getPrimeiroAcesso()
        );
    }

    @Transactional
    public TenantPublicDTO atualizarBanner(AtualizarBannerRequest req) {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        if (tenant == null) {
            tenant = tenantRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Clínica não encontrada."));
        }
        if (req.bannerTag() != null) tenant.setBannerTag(req.bannerTag().trim());
        if (req.bannerTitulo() != null) tenant.setBannerTitulo(req.bannerTitulo().trim());
        if (req.bannerSubtitulo() != null) tenant.setBannerSubtitulo(req.bannerSubtitulo().trim());
        if (req.bannerBotaoTexto() != null) tenant.setBannerBotaoTexto(req.bannerBotaoTexto().trim());

        tenant = tenantRepository.save(tenant);
        return toPublicDTO(tenant);
    }

    @Transactional
    public TenantPublicDTO atualizarIdentidadeVisual(AtualizarIdentidadeVisualRequest req) {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        if (tenant == null) {
            tenant = tenantRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Clínica não encontrada."));
        }

        if (req.nomeEmpresa() != null && !req.nomeEmpresa().isBlank()) {
            tenant.setNomeEmpresa(req.nomeEmpresa().trim());
        }

        if (req.logoUrl() != null) {
            tenant.setLogoUrl(req.logoUrl().isBlank() ? null : req.logoUrl().trim());
        }

        if (req.corPrimaria() != null && !req.corPrimaria().isBlank()) {
            tenant.setCorPrimaria(req.corPrimaria().trim());
        }

        if (req.corSecundaria() != null && !req.corSecundaria().isBlank()) {
            tenant.setCorSecundaria(req.corSecundaria().trim());
        }

        if (req.telefoneWhatsApp() != null && !req.telefoneWhatsApp().isBlank()) {
            tenant.setTelefoneWhatsApp(req.telefoneWhatsApp().replaceAll("[^0-9]", ""));
        }

        tenant = tenantRepository.save(tenant);
        log.info("[TenantService] Identidade visual e cores atualizadas para a loja: {}", tenant.getNomeEmpresa());
        return toPublicDTO(tenant);
    }
}
