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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final ClinicaTenantRepository tenantRepository;
    private final UsuarioRepository usuarioRepository;
    private final com.estetica.repository.LojistaRepository lojistaRepository;
    private final com.estetica.repository.ProcedimentoRepository procedimentoRepository;
    private final com.estetica.repository.AgendamentoRepository agendamentoRepository;
    private final com.estetica.repository.ProfissionalRepository profissionalRepository;
    private final com.estetica.repository.BloqueioAgendaRepository bloqueioAgendaRepository;
    private final com.estetica.repository.HistoricoAtendimentoRepository historicoAtendimentoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TenantResolverService tenantResolverService;
    private final MercadoPagoService mercadoPagoService;
    private final CoolifyIntegrationService coolifyIntegrationService;

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

        com.estetica.model.SetorAtuacao setorAtuacao = com.estetica.model.SetorAtuacao.CLINICA_ESTETICA;
        if (request.setor() != null && !request.setor().isBlank()) {
            try {
                setorAtuacao = com.estetica.model.SetorAtuacao.valueOf(request.setor().trim().toUpperCase());
            } catch (Exception ignored) {
                setorAtuacao = com.estetica.model.SetorAtuacao.CLINICA_ESTETICA;
            }
        }

        // 1. Salva o Lojista na tabela dedicada tb_lojista (separado de usuários comuns)
        com.estetica.model.Lojista lojista = com.estetica.model.Lojista.builder()
                .nomeEmpresa(request.nomeEmpresa().trim())
                .setor(setorAtuacao)
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

        // 2. Salva o Estabelecimento / Tenant da Loja vinculada ao Lojista
        ClinicaTenant tenant = ClinicaTenant.builder()
                .nomeEmpresa(request.nomeEmpresa().trim())
                .setor(setorAtuacao)
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

            // Provisiona automaticamente o subdomínio da loja no Coolify / Traefik
            coolifyIntegrationService.adicionarDominioLojista(cleanSlug);
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

        com.estetica.model.Lojista lojista = lojistaRepository.findByQualquerPaymentId(paymentId).orElse(null);
        ClinicaTenant tenant = tenantRepository.findByQualquerPaymentId(paymentId).orElse(null);

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
            LocalDateTime agora = LocalDateTime.now();
            boolean ehRenovacao = (lojista != null && paymentId.equals(lojista.getRenovacaoPaymentId()))
                    || (tenant != null && paymentId.equals(tenant.getRenovacaoPaymentId()));

            // REGRA DE CÁLCULO DE VENCIMENTO:
            // "caso o usuario pague antes dos 30 dias EX: faltando 4 dias para acabar e ele fizer o pagamento,
            // sera contado somente apos acabar os 4 dias restantes"
            LocalDateTime baseDate = agora;
            LocalDateTime vencimentoAtual = lojista != null ? lojista.getDataVencimento() : (tenant != null ? tenant.getDataVencimento() : null);
            if (vencimentoAtual != null && vencimentoAtual.isAfter(agora)) {
                baseDate = vencimentoAtual; // Soma +30 dias a partir do vencimento futuro restante
            }
            LocalDateTime novaDataVencimento = baseDate.plusDays(30);

            if (tenant != null) {
                log.info("[TenantService] Pagamento aprovado para a loja: {}. Nova data de vencimento: {}", tenant.getNomeEmpresa(), novaDataVencimento);
                tenant.setAtivo(true);
                tenant.setStatusPagamento("APROVADO");
                tenant.setDataPagamento(agora);
                tenant.setDataVencimento(novaDataVencimento);
                if (ehRenovacao) {
                    tenant.setRenovacaoPaymentId(null);
                    tenant.setRenovacaoPixCopiaCola(null);
                    tenant.setRenovacaoPixQrCodeBase64(null);
                    tenant.setRenovacaoCriadaEm(null);
                }
                tenant = tenantRepository.save(tenant);
            }

            if (lojista != null) {
                log.info("[TenantService] Pagamento aprovado para o lojista: {}. Nova data de vencimento: {}", lojista.getNomeEmpresa(), novaDataVencimento);
                lojista.setAtivo(true);
                lojista.setStatusPagamento("APROVADO");
                lojista.setDataPagamento(agora);
                lojista.setDataVencimento(novaDataVencimento);
                if (ehRenovacao) {
                    lojista.setRenovacaoPaymentId(null);
                    lojista.setRenovacaoPixCopiaCola(null);
                    lojista.setRenovacaoPixQrCodeBase64(null);
                    lojista.setRenovacaoCriadaEm(null);
                }
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
                .orElseThrow(() -> new RecursoNaoEncontradoException("Estabelecimento não encontrado com o link: " + slug));
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
        Long diasRestantes = null;
        if (t.getDataVencimento() != null) {
            diasRestantes = java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now().toLocalDate(), t.getDataVencimento().toLocalDate());
        }
        String setorNome = t.getSetor() != null ? t.getSetor().name() : "CLINICA_ESTETICA";
        return new TenantPublicDTO(
                t.getId(),
                t.getNomeEmpresa(),
                setorNome,
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
                t.getAtivo(),
                t.getDataVencimento(),
                diasRestantes
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
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Estabelecimento não encontrado."));
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
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Estabelecimento não encontrado."));
        }

        if (req.nomeEmpresa() != null && !req.nomeEmpresa().isBlank()) {
            tenant.setNomeEmpresa(req.nomeEmpresa().trim());
        }

        if (req.setor() != null && !req.setor().isBlank()) {
            try {
                com.estetica.model.SetorAtuacao st = com.estetica.model.SetorAtuacao.valueOf(req.setor().trim().toUpperCase());
                boolean mudouSetor = tenant.getSetor() != null && !tenant.getSetor().equals(st);
                if (mudouSetor) {
                    log.warn("[TenantService] Tenant {} mudou de setor de {} para {}. Limpando dados anteriores...", tenant.getId(), tenant.getSetor(), st);
                    limparDadosDoTenantPorMudancaDeSetor(tenant.getId());
                }
                tenant.setSetor(st);
                if (tenant.getLojista() != null) {
                    tenant.getLojista().setSetor(st);
                    lojistaRepository.save(tenant.getLojista());
                }
            } catch (Exception ignored) {}
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

    @Transactional
    public void limparDadosDoTenantPorMudancaDeSetor(Long tenantId) {
        log.warn("[TenantService] Limpando dados do tenant {} devido a mudanca de nicho...", tenantId);
        try {
            historicoAtendimentoRepository.deleteByTenantId(tenantId);
        } catch (Exception e) {
            log.error("Erro ao deletar historico de atendimento do tenant {}: {}", tenantId, e.getMessage());
        }
        try {
            bloqueioAgendaRepository.deleteByTenantId(tenantId);
        } catch (Exception e) {
            log.error("Erro ao deletar bloqueios do tenant {}: {}", tenantId, e.getMessage());
        }
        try {
            agendamentoRepository.deleteByTenantId(tenantId);
        } catch (Exception e) {
            log.error("Erro ao deletar agendamentos do tenant {}: {}", tenantId, e.getMessage());
        }
        try {
            List<com.estetica.model.Profissional> profissionais = profissionalRepository.findByTenantIdOrderByNomeAsc(tenantId);
            for (com.estetica.model.Profissional p : profissionais) {
                p.getProcedimentos().clear();
                profissionalRepository.save(p);
            }
            procedimentoRepository.deleteByTenantId(tenantId);
        } catch (Exception e) {
            log.error("Erro ao deletar procedimentos do tenant {}: {}", tenantId, e.getMessage());
        }
    }

    @Transactional
    public AssinaturaStatusResponse obterStatusAssinatura(String slugParam) {
        ClinicaTenant tenant = null;
        com.estetica.model.Lojista lojista = null;

        if (slugParam != null && !slugParam.isBlank()) {
            lojista = lojistaRepository.findBySlugIgnoreCase(slugParam.trim()).orElse(null);
            tenant = tenantRepository.findBySlugIgnoreCase(slugParam.trim()).orElse(null);
        }

        if (lojista == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof com.estetica.model.Lojista l) {
                lojista = lojistaRepository.findById(l.getId()).orElse(null);
            }

            if (lojista == null && auth != null && auth.getPrincipal() instanceof Usuario u && u.getTenant() != null) {
                tenant = u.getTenant();
                lojista = lojistaRepository.findBySlugIgnoreCase(tenant.getSlug()).orElse(null);
            }
        }

        if (lojista == null && tenant == null) {
            tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
            if (tenant != null) {
                lojista = lojistaRepository.findBySlugIgnoreCase(tenant.getSlug()).orElse(null);
            }
        }

        if (lojista == null && tenant == null) {
            lojista = lojistaRepository.findAll().stream().findFirst().orElse(null);
            if (lojista != null) {
                tenant = tenantRepository.findBySlugIgnoreCase(lojista.getSlug()).orElse(null);
            }
        }

        if (lojista == null && tenant == null) {
            throw new RegraNegocioException("Nenhuma assinatura de lojista encontrada.");
        }

        String nomeEmpresa = lojista != null ? lojista.getNomeEmpresa() : tenant.getNomeEmpresa();
        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime vencimento = lojista != null ? lojista.getDataVencimento() : tenant.getDataVencimento();

        // Se ainda não tinha vencimento inicial registrado, inicializa com base no pagamento/criação + 30 dias
        if (vencimento == null) {
            LocalDateTime dataBase = agora;
            if (lojista != null && lojista.getDataPagamento() != null) {
                dataBase = lojista.getDataPagamento();
            } else if (tenant != null && tenant.getDataPagamento() != null) {
                dataBase = tenant.getDataPagamento();
            } else if (lojista != null && lojista.getDataCriacao() != null) {
                dataBase = lojista.getDataCriacao();
            }
            vencimento = dataBase.plusDays(30);

            if (lojista != null) {
                lojista.setDataVencimento(vencimento);
                lojistaRepository.save(lojista);
            }
            if (tenant != null) {
                tenant.setDataVencimento(vencimento);
                tenantRepository.save(tenant);
            }
        }

        long diasRestantes = java.time.temporal.ChronoUnit.DAYS.between(agora.toLocalDate(), vencimento.toLocalDate());
        boolean vencida = agora.isAfter(vencimento);
        boolean podeRenovar = diasRestantes <= 5 || vencida;
        String status = vencida ? "VENCIDA" : (diasRestantes <= 5 ? "VENCENDO" : "ATIVA");

        String paymentId = null;
        String pixCopiaCola = null;
        String pixQrCodeBase64 = null;

        // Quando faltar 5 dias para o vencimento (ou se já estiver vencida), gera o PIX automaticamente
        if (podeRenovar) {
            boolean reutilizar = lojista != null
                    && lojista.getRenovacaoPaymentId() != null
                    && lojista.getRenovacaoCriadaEm() != null
                    && lojista.getRenovacaoCriadaEm().isAfter(agora.minusMinutes(25))
                    && lojista.getRenovacaoPixQrCodeBase64() != null;

            if (reutilizar) {
                paymentId = lojista.getRenovacaoPaymentId();
                pixCopiaCola = lojista.getRenovacaoPixCopiaCola();
                pixQrCodeBase64 = lojista.getRenovacaoPixQrCodeBase64();
            } else {
                try {
                    BigDecimal valor = new BigDecimal("149.90");
                    Map<String, Object> mp = mercadoPagoService.criarPagamentoPix(
                            tenant,
                            lojista,
                            valor,
                            "Renovação Mensal da Assinatura - " + nomeEmpresa
                    );

                    if (mp != null) {
                        paymentId = String.valueOf(mp.get("id"));
                        Map<String, Object> poi = (Map<String, Object>) mp.get("point_of_interaction");
                        if (poi != null && poi.get("transaction_data") != null) {
                            Map<String, Object> td = (Map<String, Object>) poi.get("transaction_data");
                            pixCopiaCola = (String) td.get("qr_code");
                            pixQrCodeBase64 = (String) td.get("qr_code_base64");
                        }

                        if (lojista != null) {
                            lojista.setRenovacaoPaymentId(paymentId);
                            lojista.setRenovacaoPixCopiaCola(pixCopiaCola);
                            lojista.setRenovacaoPixQrCodeBase64(pixQrCodeBase64);
                            lojista.setRenovacaoCriadaEm(agora);
                            lojistaRepository.save(lojista);
                        }
                        if (tenant != null) {
                            tenant.setRenovacaoPaymentId(paymentId);
                            tenant.setRenovacaoPixCopiaCola(pixCopiaCola);
                            tenant.setRenovacaoPixQrCodeBase64(pixQrCodeBase64);
                            tenant.setRenovacaoCriadaEm(agora);
                            tenantRepository.save(tenant);
                        }
                    }
                } catch (Exception ex) {
                    log.error("[TenantService] Erro ao gerar Pix de renovação automático: {}", ex.getMessage(), ex);
                }
            }
        }

        LocalDateTime dataPagamento = lojista != null ? lojista.getDataPagamento() : (tenant != null ? tenant.getDataPagamento() : null);

        return new AssinaturaStatusResponse(
                nomeEmpresa,
                status,
                vencimento,
                dataPagamento,
                diasRestantes,
                podeRenovar,
                vencida,
                new BigDecimal("149.90"),
                paymentId,
                pixCopiaCola,
                pixQrCodeBase64
        );
    }

    @Transactional
    public AssinaturaStatusResponse forcarGerarPixRenovacao(String slugParam) {
        ClinicaTenant tenant = null;
        com.estetica.model.Lojista lojista = null;

        if (slugParam != null && !slugParam.isBlank()) {
            lojista = lojistaRepository.findBySlugIgnoreCase(slugParam.trim()).orElse(null);
            tenant = tenantRepository.findBySlugIgnoreCase(slugParam.trim()).orElse(null);
        }

        if (lojista == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof com.estetica.model.Lojista l) {
                lojista = lojistaRepository.findById(l.getId()).orElse(null);
            }
            if (lojista == null && auth != null && auth.getPrincipal() instanceof Usuario u && u.getTenant() != null) {
                tenant = u.getTenant();
                lojista = lojistaRepository.findBySlugIgnoreCase(tenant.getSlug()).orElse(null);
            }
        }

        if (lojista == null && tenant == null) {
            tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
            if (tenant != null) {
                lojista = lojistaRepository.findBySlugIgnoreCase(tenant.getSlug()).orElse(null);
            }
        }

        if (lojista == null && tenant == null) {
            lojista = lojistaRepository.findAll().stream().findFirst().orElse(null);
            if (lojista != null) {
                tenant = tenantRepository.findBySlugIgnoreCase(lojista.getSlug()).orElse(null);
            }
        }

        String nomeEmpresa = lojista != null ? lojista.getNomeEmpresa() : (tenant != null ? tenant.getNomeEmpresa() : "Estabelecimento");
        LocalDateTime agora = LocalDateTime.now();

        // Força a geração imediata do Pix no Mercado Pago
        try {
            BigDecimal valor = new BigDecimal("149.90");
            Map<String, Object> mp = mercadoPagoService.criarPagamentoPix(
                    tenant,
                    lojista,
                    valor,
                    "Renovação Mensal da Assinatura - " + nomeEmpresa
            );

            if (mp != null) {
                String paymentId = String.valueOf(mp.get("id"));
                String pixCopiaCola = null;
                String pixQrCodeBase64 = null;
                Map<String, Object> poi = (Map<String, Object>) mp.get("point_of_interaction");
                if (poi != null && poi.get("transaction_data") != null) {
                    Map<String, Object> td = (Map<String, Object>) poi.get("transaction_data");
                    pixCopiaCola = (String) td.get("qr_code");
                    pixQrCodeBase64 = (String) td.get("qr_code_base64");
                }

                if (lojista != null) {
                    lojista.setRenovacaoPaymentId(paymentId);
                    lojista.setRenovacaoPixCopiaCola(pixCopiaCola);
                    lojista.setRenovacaoPixQrCodeBase64(pixQrCodeBase64);
                    lojista.setRenovacaoCriadaEm(agora);
                    lojistaRepository.save(lojista);
                }
                if (tenant != null) {
                    tenant.setRenovacaoPaymentId(paymentId);
                    tenant.setRenovacaoPixCopiaCola(pixCopiaCola);
                    tenant.setRenovacaoPixQrCodeBase64(pixQrCodeBase64);
                    tenant.setRenovacaoCriadaEm(agora);
                    tenantRepository.save(tenant);
                }

                LocalDateTime vencimento = lojista != null ? lojista.getDataVencimento() : (tenant != null ? tenant.getDataVencimento() : agora.plusDays(30));
                long diasRestantes = java.time.temporal.ChronoUnit.DAYS.between(agora.toLocalDate(), vencimento.toLocalDate());
                boolean vencida = agora.isAfter(vencimento);

                return new AssinaturaStatusResponse(
                        nomeEmpresa,
                        vencida ? "VENCIDA" : "VENCENDO",
                        vencimento,
                        lojista != null ? lojista.getDataPagamento() : null,
                        diasRestantes,
                        true,
                        vencida,
                        valor,
                        paymentId,
                        pixCopiaCola,
                        pixQrCodeBase64
                );
            }
        } catch (Exception ex) {
            log.error("[TenantService] Erro ao forçar geração de Pix de renovação: {}", ex.getMessage(), ex);
        }

        return obterStatusAssinatura(slugParam);
    }
}
