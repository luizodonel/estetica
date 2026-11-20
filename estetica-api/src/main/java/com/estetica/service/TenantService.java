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
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    @PersistenceContext
    private EntityManager entityManager;

    private final ClinicaTenantRepository tenantRepository;
    private final UsuarioRepository usuarioRepository;
    private final com.estetica.repository.LojistaRepository lojistaRepository;
    private final com.estetica.repository.CategoriaRepository categoriaRepository;
    private final com.estetica.repository.ProcedimentoRepository procedimentoRepository;
    private final com.estetica.repository.AgendamentoRepository agendamentoRepository;
    private final com.estetica.repository.ProfissionalRepository profissionalRepository;
    private final com.estetica.repository.HorarioTrabalhoRepository horarioTrabalhoRepository;
    private final com.estetica.repository.BloqueioAgendaRepository bloqueioAgendaRepository;
    private final com.estetica.repository.HistoricoAtendimentoRepository historicoAtendimentoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TenantResolverService tenantResolverService;
    private final MercadoPagoService mercadoPagoService;
    private final CoolifyIntegrationService coolifyIntegrationService;
    private final ProcedimentoService procedimentoService;
    private final jakarta.servlet.http.HttpServletRequest httpServletRequest;

    private static final BigDecimal VALOR_ADESAO_PIX = new BigDecimal("99.90");
    private static final int DIAS_TRIAL_GRATIS = 7;

    public static BigDecimal calcularValorPlano(String plano, String ciclo) {
        String p = (plano != null ? plano.trim().toUpperCase() : "PRO");
        String c = (ciclo != null ? ciclo.trim().toUpperCase() : "MENSAL");
        return switch (p) {
            case "STARTER", "STUDIO" -> switch (c) {
                case "SEMESTRAL" -> new BigDecimal("485.00");
                case "ANUAL" -> new BigDecimal("899.00");
                default -> new BigDecimal("89.90");
            };
            case "VIP", "MULTISALAS" -> switch (c) {
                case "SEMESTRAL" -> new BigDecimal("647.00");
                case "ANUAL" -> new BigDecimal("1199.00");
                default -> new BigDecimal("119.90");
            };
            default -> switch (c) { // PRO / CLÍNICA PRO
                case "SEMESTRAL" -> new BigDecimal("539.00");
                case "ANUAL" -> new BigDecimal("999.00");
                default -> new BigDecimal("99.90");
            };
        };
    }

    public static int calcularDiasCiclo(BigDecimal valorPago) {
        if (valorPago == null) return 30;
        if (valorPago.compareTo(new BigDecimal("800.00")) >= 0) {
            return 365; // Plano Anual
        }
        if (valorPago.compareTo(new BigDecimal("400.00")) >= 0) {
            return 180; // Plano Semestral
        }
        return 30; // Plano Mensal
    }

    private static final Set<String> SLUGS_RESERVADOS = Set.of(
            "admin", "api", "www", "app", "dashboard", "mail", "portal", "estetica", "agendoou", "teste"
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

        String linkPersonalizado = "https://" + cleanSlug + ".logistadigital.com.br/";
        String linkLogin = "https://" + cleanSlug + ".logistadigital.com.br/login";

        // 1. VALIDAÇÃO ESTRITA DE LINK E SUBDOMÍNIO ÚNICO (Não pode existir 2 iguais)
        if (tenantRepository.existsBySlugIgnoreCase(cleanSlug)
                || lojistaRepository.existsBySlugIgnoreCase(cleanSlug)
                || tenantRepository.existsByLinkPersonalizadoIgnoreCase(linkPersonalizado)) {
            throw new RegraNegocioException("O link exclusivo " + linkPersonalizado + " já está em uso por outro estabelecimento. Cada empresa possui um link único.");
        }

        // 2. VALIDAÇÃO DE NOME DE EMPRESA ÚNICO
        String nomeEmpresaLimpo = request.nomeEmpresa().trim();
        if (tenantRepository.existsByNomeEmpresaIgnoreCase(nomeEmpresaLimpo) || lojistaRepository.existsByNomeEmpresaIgnoreCase(nomeEmpresaLimpo)) {
            throw new RegraNegocioException("A empresa '" + nomeEmpresaLimpo + "' já possui um cadastro no sistema. Caso seu período de teste tenha expirado, acesse seu link exclusivo para renovar sua assinatura.");
        }

        // 3. VALIDAÇÃO ANTI-ABUSO DE TRIAL: E-MAIL ÚNICO
        String email = request.email().toLowerCase().trim();
        if (usuarioRepository.existsByEmail(email) || lojistaRepository.existsByEmailIgnoreCase(email)) {
            throw new RegraNegocioException("Este e-mail (" + email + ") já utilizou o período de teste grátis. Faça login no link da sua empresa para renovar sua assinatura.");
        }

        // 4. VALIDAÇÃO ANTI-ABUSO DE TRIAL: WHATSAPP ÚNICO (Normaliza com e sem 9º dígito para evitar burla)
        String telefoneLimpo = request.telefoneWhatsApp().replaceAll("[^0-9]", "");
        if (telefoneLimpo.length() < 10) {
            throw new RegraNegocioException("Informe um número de WhatsApp válido com DDD.");
        }
        String telefoneAlternativo = obterVariacaoNonoDigito(telefoneLimpo);
        if (lojistaRepository.existsByTelefoneWhatsApp(telefoneLimpo)
                || tenantRepository.existsByTelefoneWhatsApp(telefoneLimpo)
                || (telefoneAlternativo != null && (lojistaRepository.existsByTelefoneWhatsApp(telefoneAlternativo) || tenantRepository.existsByTelefoneWhatsApp(telefoneAlternativo)))) {
            throw new RegraNegocioException("Este número de WhatsApp já utilizou o período de 7 dias de teste grátis em outra conta. Acesse sua conta existente para ativar seu plano.");
        }

        // 5. VALIDAÇÃO ANTI-ABUSO DE TRIAL: CPF / CNPJ ÚNICO (com validação matemática de dígitos verificadores)
        String cpfCnpjLimpo = request.cpfCnpj() != null ? request.cpfCnpj().replaceAll("[^0-9]", "") : "";
        if (cpfCnpjLimpo.isBlank() || (!isValidCpf(cpfCnpjLimpo) && !isValidCnpj(cpfCnpjLimpo))) {
            throw new RegraNegocioException("Informe um CPF ou CNPJ válido do responsável/empresa para liberar os 7 dias de teste grátis.");
        }
        if (lojistaRepository.existsByCpfCnpj(cpfCnpjLimpo)) {
            throw new RegraNegocioException("Este CPF/CNPJ já utilizou o benefício único de 7 dias de teste grátis. Faça login no seu painel para assinar um plano.");
        }

        // 6. VALIDAÇÃO ANTI-ABUSO DE TRIAL: DISPOSITIVO (FINGERPRINT) E IP DO CLIENTE
        String deviceFp = (request.deviceFingerprint() != null && !request.deviceFingerprint().isBlank())
                ? request.deviceFingerprint().trim()
                : null;
        if (deviceFp != null && lojistaRepository.existsByDeviceFingerprint(deviceFp)) {
            throw new RegraNegocioException("Identificamos que este dispositivo já utilizou o período de 7 dias de teste grátis anteriormente. O teste gratuito é limitado a 1 vez por empresa/pessoa. Acesse sua conta para ativar seu plano.");
        }

        String clientIp = extrairIpCliente();
        if (clientIp != null && !isIpLocal(clientIp) && lojistaRepository.existsByIpCadastro(clientIp)) {
            throw new RegraNegocioException("Já existe uma conta de avaliação gratuita criada a partir desta conexão/rede. O período de 7 dias grátis é permitido apenas uma única vez por lojista.");
        }

        // 7. Validação do Usuário / Login de Administrador (campo livre)
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

        com.estetica.model.SetorAtuacao setorAtuacao = com.estetica.model.SetorAtuacao.CLINICA_ESTETICA;
        if (request.setor() != null && !request.setor().isBlank()) {
            try {
                setorAtuacao = com.estetica.model.SetorAtuacao.valueOf(request.setor().trim().toUpperCase());
            } catch (Exception ignored) {
                setorAtuacao = com.estetica.model.SetorAtuacao.CLINICA_ESTETICA;
            }
        }

        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime vencimentoTrial = agora.plusDays(DIAS_TRIAL_GRATIS);

        // 1. Salva o Lojista já ATIVO em período de TESTE GRÁTIS (Trial único de 7 dias blindado por CPF/CNPJ, WhatsApp, Email, IP e Fingerprint)
        com.estetica.model.Lojista lojista = com.estetica.model.Lojista.builder()
                .nomeEmpresa(nomeEmpresaLimpo)
                .setor(setorAtuacao)
                .slug(cleanSlug)
                .linkPersonalizado(linkPersonalizado)
                .linkLogin(linkLogin)
                .nomeResponsavel(request.nomeResponsavel().trim())
                .login(customLogin)
                .email(email)
                .telefoneWhatsApp(telefoneLimpo)
                .cpfCnpj(cpfCnpjLimpo)
                .ipCadastro(clientIp)
                .deviceFingerprint(deviceFp)
                .senhaHash(passwordEncoder.encode(request.senha()))
                .logoUrl(request.logoUrl() != null && !request.logoUrl().isBlank() ? request.logoUrl().trim() : null)
                .corPrimaria(corPrimaria)
                .corSecundaria(corSecundaria)
                .statusPagamento("TRIAL")
                .valorAdesao(VALOR_ADESAO_PIX)
                .dataVencimento(vencimentoTrial)
                .ativo(true)
                .build();
        lojista = lojistaRepository.save(lojista);

        // 2. Salva o Estabelecimento / Tenant da Loja já ativo com Trial de 7 dias
        ClinicaTenant tenant = ClinicaTenant.builder()
                .nomeEmpresa(nomeEmpresaLimpo)
                .setor(setorAtuacao)
                .slug(cleanSlug)
                .linkPersonalizado(linkPersonalizado)
                .logoUrl(request.logoUrl() != null && !request.logoUrl().isBlank() ? request.logoUrl().trim() : null)
                .corPrimaria(corPrimaria)
                .corSecundaria(corSecundaria)
                .lojista(lojista)
                .telefoneWhatsApp(telefoneLimpo)
                .cpfCnpj(cpfCnpjLimpo)
                .ipCadastro(clientIp)
                .deviceFingerprint(deviceFp)
                .statusPagamento("TRIAL")
                .valorAdesao(VALOR_ADESAO_PIX)
                .dataVencimento(vencimentoTrial)
                .ativo(true)
                .build();
        tenant = tenantRepository.save(tenant);

        // 3. Inicializa o catálogo completo do nicho (categorias e procedimentos) imediatamente
        try {
            procedimentoService.inicializarCategoriasPadraoParaTenant(tenant, setorAtuacao);
            inicializarProfissionalPadraoParaTenant(tenant, lojista);
        } catch (Exception ex) {
            log.warn("[TenantService] Nota ao inicializar catálogo/profissional padrão do trial: {}", ex.getMessage());
        }

        // 4. Provisiona subdomínio no Coolify imediatamente para que o link exclusivo já funcione no Trial
        try {
            coolifyIntegrationService.adicionarDominioLojista(cleanSlug);
        } catch (Exception ex) {
            log.warn("[TenantService] Nota ao provisionar domínio Coolify no trial: {}", ex.getMessage());
        }

        // 5. Emite token JWT imediatamente para login automático (Product-Led Growth)
        String token = jwtService.gerarToken(lojista);

        UsuarioDTO lojistaDTO = new UsuarioDTO(
                lojista.getId(),
                lojista.getNomeResponsavel(),
                lojista.getEmail(),
                lojista.getTelefoneWhatsApp(),
                Role.ROLE_ADMIN,
                true,
                false
        );
        TenantPublicDTO tenantDTO = toPublicDTO(tenant);

        return new CadastroLojistaResponse(
                null,
                null,
                null,
                VALOR_ADESAO_PIX,
                "TRIAL",
                linkPersonalizado,
                tenantDTO,
                lojistaDTO,
                token
        );
    }

    private void inicializarProfissionalPadraoParaTenant(ClinicaTenant tenant, com.estetica.model.Lojista lojista) {
        if (tenant == null || !profissionalRepository.findByTenantIdOrderByNomeAsc(tenant.getId()).isEmpty()) {
            return;
        }

        List<com.estetica.model.Procedimento> procs = procedimentoRepository.findByTenantIdOrderByTituloAsc(tenant.getId());
        java.util.Set<com.estetica.model.Procedimento> procedimentosSet = new java.util.HashSet<>(procs);

        String nomeProf = (lojista != null && lojista.getNomeResponsavel() != null && !lojista.getNomeResponsavel().isBlank())
                ? lojista.getNomeResponsavel().trim()
                : "Especialista Principal";

        com.estetica.model.Profissional prof = com.estetica.model.Profissional.builder()
                .tenant(tenant)
                .nome(nomeProf)
                .especialidade("Especialista Responsável")
                .bio("Atendimento especializado em " + tenant.getNomeEmpresa())
                .corIdentificacao("#e11d48")
                .ativo(true)
                .procedimentos(procedimentosSet)
                .build();
        prof = profissionalRepository.save(prof);

        for (java.time.DayOfWeek dia : java.time.DayOfWeek.values()) {
            if (dia == java.time.DayOfWeek.SUNDAY) continue;
            com.estetica.model.HorarioTrabalho ht = com.estetica.model.HorarioTrabalho.builder()
                    .profissional(prof)
                    .diaSemana(dia)
                    .horaInicio(java.time.LocalTime.of(8, 0))
                    .horaFim(java.time.LocalTime.of(19, 0))
                    .inicioIntervalo(null)
                    .fimIntervalo(null)
                    .ativo(true)
                    .build();
            horarioTrabalhoRepository.save(ht);
        }
        log.info("[TenantService] Profissional padrão '{}' e horários de atendimento inicializados para o tenant {}", nomeProf, tenant.getSlug());
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

        // Fallback via external_reference (ex: pagamentos via Cartão de Crédito no Checkout Pro do Mercado Pago)
        if (lojista == null && tenant == null && mpResponse != null && mpResponse.get("external_reference") != null) {
            String extRef = String.valueOf(mpResponse.get("external_reference"));
            try {
                if (extRef.startsWith("LOJISTA-")) {
                    Long lid = Long.parseLong(extRef.replace("LOJISTA-", "").trim());
                    lojista = lojistaRepository.findById(lid).orElse(null);
                } else if (extRef.startsWith("TENANT-")) {
                    Long tid = Long.parseLong(extRef.replace("TENANT-", "").trim());
                    tenant = tenantRepository.findById(tid).orElse(null);
                }
            } catch (Exception ignored) {
            }
        }

        if (tenant == null && lojista != null) {
            tenant = tenantRepository.findBySlugIgnoreCase(lojista.getSlug()).orElse(null);
        }
        if (lojista == null && tenant != null && tenant.getSlug() != null) {
            lojista = lojistaRepository.findBySlugIgnoreCase(tenant.getSlug()).orElse(null);
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

            boolean jaProcessado = (lojista != null && paymentId.equals(lojista.getUltimoPaymentIdAprovado()))
                    || (tenant != null && paymentId.equals(tenant.getUltimoPaymentIdAprovado()));

            if (!jaProcessado) {
                boolean eraInativo = (tenant != null && !Boolean.TRUE.equals(tenant.getAtivo()))
                        || (lojista != null && !Boolean.TRUE.equals(lojista.getAtivo()));

                // REGRA DE CÁLCULO DE VENCIMENTO:
                // Caso o usuário pague antes do vencimento, soma os dias do ciclo contratado (30, 180 ou 365) a partir do vencimento futuro restante.
                LocalDateTime baseDate = agora;
                LocalDateTime vencimentoAtual = lojista != null ? lojista.getDataVencimento() : (tenant != null ? tenant.getDataVencimento() : null);
                if (vencimentoAtual != null && vencimentoAtual.isAfter(agora)) {
                    baseDate = vencimentoAtual;
                }
                BigDecimal valorPagoMp = null;
                if (mpResponse != null && mpResponse.get("transaction_amount") != null) {
                    try {
                        valorPagoMp = new BigDecimal(String.valueOf(mpResponse.get("transaction_amount")));
                    } catch (Exception ignored) {
                    }
                }
                BigDecimal valorRef = (valorPagoMp != null && valorPagoMp.compareTo(BigDecimal.ZERO) > 0)
                        ? valorPagoMp
                        : ((lojista != null && lojista.getValorAdesao() != null)
                                ? lojista.getValorAdesao()
                                : (tenant != null && tenant.getValorAdesao() != null ? tenant.getValorAdesao() : VALOR_ADESAO_PIX));
                int diasAdicionar = calcularDiasCiclo(valorRef);
                LocalDateTime novaDataVencimento = baseDate.plusDays(diasAdicionar);

                if (tenant != null) {
                    log.info("[TenantService] Pagamento {} aprovado para a loja: {}. Nova data de vencimento: {}", paymentId, tenant.getNomeEmpresa(), novaDataVencimento);
                    tenant.setAtivo(true);
                    tenant.setStatusPagamento("APROVADO");
                    tenant.setDataPagamento(agora);
                    tenant.setDataVencimento(novaDataVencimento);
                    tenant.setUltimoPaymentIdAprovado(paymentId);
                    if (ehRenovacao) {
                        tenant.setRenovacaoPaymentId(null);
                        tenant.setRenovacaoPixCopiaCola(null);
                        tenant.setRenovacaoPixQrCodeBase64(null);
                        tenant.setRenovacaoCriadaEm(null);
                    }
                    tenant = tenantRepository.save(tenant);

                    if (eraInativo && categoriaRepository.findByTenantIdOrderByOrdemExibicaoAsc(tenant.getId()).isEmpty()) {
                        com.estetica.model.SetorAtuacao setorAtivo = tenant.getSetor() != null ? tenant.getSetor() : com.estetica.model.SetorAtuacao.CLINICA_ESTETICA;
                        procedimentoService.inicializarCategoriasPadraoParaTenant(tenant, setorAtivo);
                    }
                }

                if (lojista != null) {
                    log.info("[TenantService] Pagamento {} aprovado para o lojista: {}. Nova data de vencimento: {}", paymentId, lojista.getNomeEmpresa(), novaDataVencimento);
                    lojista.setAtivo(true);
                    lojista.setStatusPagamento("APROVADO");
                    lojista.setDataPagamento(agora);
                    lojista.setDataVencimento(novaDataVencimento);
                    lojista.setUltimoPaymentIdAprovado(paymentId);
                    if (ehRenovacao) {
                        lojista.setRenovacaoPaymentId(null);
                        lojista.setRenovacaoPixCopiaCola(null);
                        lojista.setRenovacaoPixQrCodeBase64(null);
                        lojista.setRenovacaoCriadaEm(null);
                    }
                    lojista = lojistaRepository.save(lojista);
                }

                // Provisiona subdomínio somente após confirmação real do pagamento PIX
                if (eraInativo && slug != null) {
                    coolifyIntegrationService.adicionarDominioLojista(slug);
                }
            } else {
                log.debug("[TenantService] Pagamento {} já havia sido creditado anteriormente (idempotência).", paymentId);
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
        if ("estetica".equalsIgnoreCase(cleanSlug) || "agendoou".equalsIgnoreCase(cleanSlug)) {
            ClinicaTenant master = tenantRepository.findBySlugIgnoreCase("agendoou")
                    .or(() -> tenantRepository.findBySlugIgnoreCase("estetica"))
                    .or(() -> tenantRepository.findAll().stream().findFirst())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Estabelecimento principal não encontrado."));
            return toPublicDTO(master);
        }
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
        String linkCandidato = "https://" + cleanSlug + ".logistadigital.com.br/";
        return !tenantRepository.existsBySlugIgnoreCase(cleanSlug)
                && !lojistaRepository.existsBySlugIgnoreCase(cleanSlug)
                && !tenantRepository.existsByLinkPersonalizadoIgnoreCase(linkCandidato);
    }

    private String obterVariacaoNonoDigito(String fone) {
        if (fone == null) return null;
        if (fone.length() == 11 && fone.charAt(2) == '9') {
            return fone.substring(0, 2) + fone.substring(3);
        }
        if (fone.length() == 10) {
            return fone.substring(0, 2) + "9" + fone.substring(2);
        }
        return null;
    }

    private String extrairIpCliente() {
        if (httpServletRequest == null) return null;
        String xff = httpServletRequest.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String realIp = httpServletRequest.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return httpServletRequest.getRemoteAddr();
    }

    private boolean isIpLocal(String ip) {
        if (ip == null) return true;
        return ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1") || ip.equals("::1") || ip.startsWith("172.") || ip.startsWith("10.") || ip.startsWith("192.168.");
    }

    public static boolean isValidCpf(String cpf) {
        if (cpf == null || cpf.length() != 11 || cpf.chars().distinct().count() == 1) return false;
        try {
            int d1 = 0, d2 = 0;
            for (int i = 0; i < 9; i++) {
                int digito = cpf.charAt(i) - '0';
                d1 += digito * (10 - i);
                d2 += digito * (11 - i);
            }
            int resto1 = (d1 * 10) % 11;
            if (resto1 == 10) resto1 = 0;
            if (resto1 != (cpf.charAt(9) - '0')) return false;

            d2 += resto1 * 2;
            int resto2 = (d2 * 10) % 11;
            if (resto2 == 10) resto2 = 0;
            return resto2 == (cpf.charAt(10) - '0');
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean isValidCnpj(String cnpj) {
        if (cnpj == null || cnpj.length() != 14 || cnpj.chars().distinct().count() == 1) return false;
        try {
            int[] peso1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
            int[] peso2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
            int soma1 = 0, soma2 = 0;
            for (int i = 0; i < 12; i++) {
                int dig = cnpj.charAt(i) - '0';
                soma1 += dig * peso1[i];
                soma2 += dig * peso2[i];
            }
            int r1 = soma1 % 11;
            int d1 = (r1 < 2) ? 0 : 11 - r1;
            if (d1 != (cnpj.charAt(12) - '0')) return false;

            soma2 += d1 * peso2[12];
            int r2 = soma2 % 11;
            int d2 = (r2 < 2) ? 0 : 11 - r2;
            return d2 == (cnpj.charAt(13) - '0');
        } catch (Exception e) {
            return false;
        }
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

    private String getBannerTagPadrao(com.estetica.model.SetorAtuacao setor) {
        if (setor == null) return "✨ Cuidado & Alta Tecnologia";
        return switch (setor) {
            case ESTUDIO_FOTOGRAFICO -> "📷 Fotografia & Produção";
            case BARBEARIA -> "💈 Estilo & Tradição Masculina";
            case SALAO_BELEZA -> "✨ Beleza & Autoestima";
            case ESTETICA_AUTOMOTIVA -> "🚗 Cuidado & Proteção Automotiva";
            case SPA_MASSOTERAPIA -> "🌿 Bem-Estar & Relaxamento";
            case DENTISTA -> "🦷 Saúde & Harmonia Bucal";
            case TATUAGEM -> "🎨 Arte & Expressão na Pele";
            default -> "✨ Cuidado & Alta Tecnologia";
        };
    }

    private String getBannerTituloPadrao(com.estetica.model.SetorAtuacao setor) {
        if (setor == null) return "Realce sua melhor versão com tratamentos exclusivos.";
        return switch (setor) {
            case ESTUDIO_FOTOGRAFICO -> "Eternize seus melhores momentos com ensaios inesquecíveis.";
            case BARBEARIA -> "Cortes modernos, barba alinhada e visual impecável.";
            case SALAO_BELEZA -> "Transforme seu visual com especialistas em beleza.";
            case ESTETICA_AUTOMOTIVA -> "Proteção, brilho e detalhamento de alto padrão.";
            case SPA_MASSOTERAPIA -> "Renove suas energias e equilibre corpo e mente.";
            case DENTISTA -> "Conquiste um sorriso radiante e uma saúde bucal impecável.";
            case TATUAGEM -> "Sua história e personalidade transformadas em arte corporal.";
            default -> "Realce sua melhor versão com tratamentos exclusivos.";
        };
    }

    private String getBannerSubtituloPadrao(com.estetica.model.SetorAtuacao setor) {
        if (setor == null) return "Protocolos personalizados, equipamentos de última geração e especialistas dedicados ao seu bem-estar e autoestima.";
        return switch (setor) {
            case ESTUDIO_FOTOGRAFICO -> "Estúdio climatizado, iluminação de ponta, figurinos exclusivos e direção profissional.";
            case BARBEARIA -> "Toalha quente, navalha afiada, produtos de primeira linha e ambiente exclusivo.";
            case SALAO_BELEZA -> "Cabelos, unhas, maquiagens e cuidados executados com produtos renomados.";
            case ESTETICA_AUTOMOTIVA -> "Lavagem detalhada, vitrificação de pintura, higienização interna e restauração automotiva.";
            case SPA_MASSOTERAPIA -> "Massagens relaxantes, drenagens terapêuticas e rituais de spa para aliviar o estresse.";
            case DENTISTA -> "Clareamentos, harmonização orofacial e procedimentos odontológicos modernos.";
            case TATUAGEM -> "Ambiente 100% biosseguro, materiais descartáveis e artistas qualificados.";
            default -> "Protocolos personalizados, equipamentos de última geração e especialistas dedicados ao seu bem-estar e autoestima.";
        };
    }

    private String getBannerBotaoPadrao(com.estetica.model.SetorAtuacao setor) {
        if (setor == null) return "Agendamento Online";
        return switch (setor) {
            case ESTUDIO_FOTOGRAFICO -> "Agendar Ensaio";
            case BARBEARIA -> "Agendar Horário";
            case SALAO_BELEZA -> "Agendar Horário";
            case ESTETICA_AUTOMOTIVA -> "Agendar Serviço";
            case SPA_MASSOTERAPIA -> "Agendar Sessão";
            case DENTISTA -> "Agendar Avaliação";
            case TATUAGEM -> "Agendar Sessão";
            default -> "Agendamento Online";
        };
    }

    private TenantPublicDTO toPublicDTO(ClinicaTenant t) {
        Long diasRestantes = null;
        if (t.getDataVencimento() != null) {
            diasRestantes = java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now().toLocalDate(), t.getDataVencimento().toLocalDate());
        }
        String setorNome = t.getSetor() != null ? t.getSetor().name() : "CLINICA_ESTETICA";

        boolean usaBannerPadraoEstetica = t.getBannerTitulo() == null 
                || "Realce sua melhor versão com tratamentos exclusivos.".equalsIgnoreCase(t.getBannerTitulo().trim());
        String bannerTag = (!usaBannerPadraoEstetica && t.getBannerTag() != null) ? t.getBannerTag() : getBannerTagPadrao(t.getSetor());
        String bannerTitulo = (!usaBannerPadraoEstetica && t.getBannerTitulo() != null) ? t.getBannerTitulo() : getBannerTituloPadrao(t.getSetor());
        String bannerSubtitulo = (!usaBannerPadraoEstetica && t.getBannerSubtitulo() != null) ? t.getBannerSubtitulo() : getBannerSubtituloPadrao(t.getSetor());
        String bannerBotao = (!usaBannerPadraoEstetica && t.getBannerBotaoTexto() != null) ? t.getBannerBotaoTexto() : getBannerBotaoPadrao(t.getSetor());

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
                (t.getHorarioFuncionamento() != null && !t.getHorarioFuncionamento().isBlank()) ? t.getHorarioFuncionamento() : "09:00 às 19:00",
                bannerTag,
                bannerTitulo,
                bannerSubtitulo,
                bannerBotao,
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

        boolean mudouSetor = false;
        com.estetica.model.SetorAtuacao novoSetor = null;
        if (req.setor() != null && !req.setor().isBlank()) {
            try {
                com.estetica.model.SetorAtuacao st = com.estetica.model.SetorAtuacao.valueOf(req.setor().trim().toUpperCase());
                mudouSetor = tenant.getSetor() != null && !tenant.getSetor().equals(st);
                novoSetor = st;
                if (mudouSetor) {
                    log.warn("[TenantService] Tenant {} mudou de setor de {} para {}. Limpando dados anteriores...", tenant.getId(), tenant.getSetor(), st);
                    limparDadosDoTenantPorMudancaDeSetor(tenant.getId());
                    tenant.setBannerTag(getBannerTagPadrao(st));
                    tenant.setBannerTitulo(getBannerTituloPadrao(st));
                    tenant.setBannerSubtitulo(getBannerSubtituloPadrao(st));
                    tenant.setBannerBotaoTexto(getBannerBotaoPadrao(st));
                }
                tenant.setSetor(st);
                if (tenant.getLojista() != null) {
                    tenant.getLojista().setSetor(st);
                    lojistaRepository.save(tenant.getLojista());
                }
            } catch (Exception ex) {
                log.error("[TenantService] Erro ao atualizar setor do tenant {}: {}", tenant.getId(), ex.getMessage());
            }
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

        if (req.horarioFuncionamento() != null && !req.horarioFuncionamento().isBlank()) {
            tenant.setHorarioFuncionamento(req.horarioFuncionamento().trim());
        }

        tenant = tenantRepository.save(tenant);

        if (mudouSetor && novoSetor != null) {
            log.info("[TenantService] Inicializando catálogo padrão para o tenant {} no novo nicho {}", tenant.getId(), novoSetor);
            procedimentoService.inicializarCategoriasPadraoParaTenant(tenant, novoSetor);
        }

        log.info("[TenantService] Identidade visual e cores atualizadas para a loja: {}", tenant.getNomeEmpresa());
        return toPublicDTO(tenant);
    }

    @Transactional
    public void limparDadosDoTenantPorMudancaDeSetor(Long tenantId) {
        log.warn("[TenantService] Limpando TODOS os dados operacionais do tenant {} devido a mudanca de nicho...", tenantId);
        try {
            // 1. Histórico de atendimento
            entityManager.createNativeQuery(
                "DELETE FROM tb_historico_atendimento WHERE tenant_id = :tid " +
                "OR agendamento_id IN (SELECT a.id FROM tb_agendamento a WHERE a.tenant_id = :tid) " +
                "OR profissional_id IN (SELECT p.id FROM tb_profissional p WHERE p.tenant_id = :tid) " +
                "OR cliente_id IN (SELECT u.id FROM tb_usuario u WHERE u.tenant_id = :tid)"
            ).setParameter("tid", tenantId).executeUpdate();

            // 2. Agendamentos
            entityManager.createNativeQuery(
                "DELETE FROM tb_agendamento WHERE tenant_id = :tid " +
                "OR profissional_id IN (SELECT p.id FROM tb_profissional p WHERE p.tenant_id = :tid) " +
                "OR cliente_id IN (SELECT u.id FROM tb_usuario u WHERE u.tenant_id = :tid)"
            ).setParameter("tid", tenantId).executeUpdate();

            // 3. Bloqueios de agenda dos profissionais do tenant
            entityManager.createNativeQuery(
                "DELETE FROM tb_bloqueio_agenda WHERE profissional_id IN (SELECT p.id FROM tb_profissional p WHERE p.tenant_id = :tid)"
            ).setParameter("tid", tenantId).executeUpdate();

            // 4. Horários de trabalho dos profissionais do tenant
            entityManager.createNativeQuery(
                "DELETE FROM tb_horario_trabalho WHERE profissional_id IN (SELECT p.id FROM tb_profissional p WHERE p.tenant_id = :tid)"
            ).setParameter("tid", tenantId).executeUpdate();

            // 5. Associação de procedimentos com profissionais
            entityManager.createNativeQuery(
                "DELETE FROM tb_profissional_procedimento WHERE profissional_id IN (SELECT p.id FROM tb_profissional p WHERE p.tenant_id = :tid) " +
                "OR procedimento_id IN (SELECT pr.id FROM tb_procedimento pr WHERE pr.tenant_id = :tid)"
            ).setParameter("tid", tenantId).executeUpdate();

            // 6. Procedimentos do tenant
            entityManager.createNativeQuery("DELETE FROM tb_procedimento WHERE tenant_id = :tid")
                    .setParameter("tid", tenantId)
                    .executeUpdate();

            // 7. Categorias do tenant
            entityManager.createNativeQuery("DELETE FROM tb_categoria WHERE tenant_id = :tid")
                    .setParameter("tid", tenantId)
                    .executeUpdate();

            // 8. Desvincular e remover profissionais/especialistas e seus usuários de acesso (ROLE_PROFISSIONAL)
            entityManager.createNativeQuery(
                "UPDATE tb_profissional SET usuario_id = NULL WHERE tenant_id = :tid"
            ).setParameter("tid", tenantId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM tb_profissional WHERE tenant_id = :tid")
                    .setParameter("tid", tenantId)
                    .executeUpdate();

            entityManager.createNativeQuery(
                "DELETE FROM tb_usuario WHERE tenant_id = :tid AND role = 'ROLE_PROFISSIONAL'"
            ).setParameter("tid", tenantId).executeUpdate();

            // 9. Excluir pacientes/clientes cadastrados (ROLE_CLIENTE), mantendo intacto apenas os administradores (ROLE_ADMIN)
            entityManager.createNativeQuery(
                "DELETE FROM tb_usuario WHERE tenant_id = :tid AND role = 'ROLE_CLIENTE'"
            ).setParameter("tid", tenantId).executeUpdate();

            entityManager.flush();
            log.info("[TenantService] Limpeza total de dados operacionais do tenant {} concluída com sucesso (admin e assinatura preservados).", tenantId);
        } catch (Exception e) {
            log.error("[TenantService] Erro ao limpar dados do tenant {}: {}", tenantId, e.getMessage(), e);
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
        String statusPagAtual = lojista != null ? lojista.getStatusPagamento() : (tenant != null ? tenant.getStatusPagamento() : "PENDENTE");
        boolean emTrial = "TRIAL".equalsIgnoreCase(statusPagAtual);
        boolean podeRenovar = emTrial || diasRestantes <= 5 || vencida;
        String status = vencida ? "VENCIDA" : (emTrial ? "TRIAL" : (diasRestantes <= 5 ? "VENCENDO" : "ATIVA"));

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
                    BigDecimal valor = (lojista != null && lojista.getValorAdesao() != null)
                            ? lojista.getValorAdesao()
                            : (tenant != null && tenant.getValorAdesao() != null ? tenant.getValorAdesao() : VALOR_ADESAO_PIX);
                    Map<String, Object> mp = mercadoPagoService.criarPagamentoPix(
                            tenant,
                            lojista,
                            valor,
                            "Assinatura Agendoou - " + nomeEmpresa
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
        BigDecimal valorAtivo = (lojista != null && lojista.getValorAdesao() != null)
                ? lojista.getValorAdesao()
                : (tenant != null && tenant.getValorAdesao() != null ? tenant.getValorAdesao() : VALOR_ADESAO_PIX);

        return new AssinaturaStatusResponse(
                nomeEmpresa,
                status,
                vencimento,
                dataPagamento,
                diasRestantes,
                podeRenovar,
                vencida,
                valorAtivo,
                paymentId,
                pixCopiaCola,
                pixQrCodeBase64
        );
    }

    @Transactional
    public AssinaturaStatusResponse forcarGerarPixRenovacao(String slugParam) {
        return forcarGerarPixRenovacao(slugParam, null, null);
    }

    @Transactional
    public AssinaturaStatusResponse forcarGerarPixRenovacao(String slugParam, String planoParam, String cicloParam) {
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

        // Calcula o valor exato do plano (Starter R$ 89,90 | Clínica Pro R$ 99,90 | VIP R$ 119,90) e ciclo (Mensal | Semestral | Anual)
        try {
            BigDecimal valor = (planoParam != null || cicloParam != null)
                    ? calcularValorPlano(planoParam, cicloParam)
                    : (lojista != null && lojista.getValorAdesao() != null ? lojista.getValorAdesao() : VALOR_ADESAO_PIX);

            String labelPlano = (planoParam != null && !planoParam.isBlank() ? planoParam.toUpperCase() : "PRO")
                    + " (" + (cicloParam != null && !cicloParam.isBlank() ? cicloParam.toUpperCase() : "MENSAL") + ")";

            Map<String, Object> mp = mercadoPagoService.criarPagamentoPix(
                    tenant,
                    lojista,
                    valor,
                    "Assinatura Agendoou Plano " + labelPlano + " - " + nomeEmpresa
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
                    lojista.setValorAdesao(valor);
                    lojista.setRenovacaoPaymentId(paymentId);
                    lojista.setRenovacaoPixCopiaCola(pixCopiaCola);
                    lojista.setRenovacaoPixQrCodeBase64(pixQrCodeBase64);
                    lojista.setRenovacaoCriadaEm(agora);
                    lojistaRepository.save(lojista);
                }
                if (tenant != null) {
                    tenant.setValorAdesao(valor);
                    tenant.setRenovacaoPaymentId(paymentId);
                    tenant.setRenovacaoPixCopiaCola(pixCopiaCola);
                    tenant.setRenovacaoPixQrCodeBase64(pixQrCodeBase64);
                    tenant.setRenovacaoCriadaEm(agora);
                    tenantRepository.save(tenant);
                }

                LocalDateTime vencimento = lojista != null ? lojista.getDataVencimento() : (tenant != null ? tenant.getDataVencimento() : agora.plusDays(7));
                long diasRestantes = java.time.temporal.ChronoUnit.DAYS.between(agora.toLocalDate(), vencimento.toLocalDate());
                boolean vencida = agora.isAfter(vencimento);
                String stAtual = lojista != null ? lojista.getStatusPagamento() : (tenant != null ? tenant.getStatusPagamento() : "TRIAL");
                String stResp = vencida ? "VENCIDA" : ("TRIAL".equalsIgnoreCase(stAtual) ? "TRIAL" : "VENCENDO");

                return new AssinaturaStatusResponse(
                        nomeEmpresa,
                        stResp,
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

    @Transactional
    public Map<String, Object> gerarCheckoutCartaoAssinatura(String slugParam, String planoParam, String cicloParam) {
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
            throw new RegraNegocioException("Estabelecimento não encontrado para gerar pagamento por cartão.");
        }

        BigDecimal valor = calcularValorPlano(planoParam, cicloParam);
        if (lojista != null) {
            lojista.setValorAdesao(valor);
            lojistaRepository.save(lojista);
        }
        if (tenant != null) {
            tenant.setValorAdesao(valor);
            tenantRepository.save(tenant);
        }

        String nomeEmpresa = lojista != null ? lojista.getNomeEmpresa() : tenant.getNomeEmpresa();
        String slug = lojista != null ? lojista.getSlug() : tenant.getSlug();
        String labelPlano = (planoParam != null && !planoParam.isBlank() ? planoParam.toUpperCase() : "PRO")
                + " (" + (cicloParam != null && !cicloParam.isBlank() ? cicloParam.toUpperCase() : "MENSAL") + ")";
        String titulo = "Assinatura Agendoou Plano " + labelPlano + " - " + nomeEmpresa;
        String urlRetorno = "https://" + slug + ".logistadigital.com.br/admin/assinatura";

        Map<String, Object> pref = mercadoPagoService.criarPreferenciaCheckoutCartao(tenant, lojista, valor, titulo, urlRetorno);
        return Map.of(
                "preferenceId", pref.get("id") != null ? String.valueOf(pref.get("id")) : "",
                "checkoutUrl", pref.get("init_point") != null ? String.valueOf(pref.get("init_point")) : "",
                "valor", valor
        );
    }
}
