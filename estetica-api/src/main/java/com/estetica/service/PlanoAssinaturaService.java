package com.estetica.service;

import com.estetica.dto.TenantDTOs.PlanoAssinaturaDTO;
import com.estetica.model.PlanoAssinatura;
import com.estetica.repository.PlanoAssinaturaRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlanoAssinaturaService {

    private final PlanoAssinaturaRepository planoRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void garantirPlanosPadrao() {
        criarSeAusente(
                "STARTER",
                "Studio / Starter",
                "Ideal para profissionais autônomos e studios compactos",
                false,
                null,
                null,
                "Começar no Studio / Starter",
                List.of(
                        "Domínio / Subdomínio próprio",
                        "Suporte via WhatsApp",
                        "Até 2 profissionais na agenda",
                        "Link de Agendamento Online 24h (PWA)",
                        "Cálculo automático de horários livres",
                        "Prontuário e Histórico de Anamnese",
                        "Prevenção transacional de conflitos"
                ),
                1,
                new BigDecimal("89.90"),
                new BigDecimal("485.00"),
                new BigDecimal("899.00")
        );

        criarSeAusente(
                "PRO",
                "Clínica Pro",
                "Para clínicas e empresas que buscam zerar faltas e escalar",
                true,
                "Mais Popular / Melhor Relação Custo-Benefício",
                "Tudo do Plano Studio +",
                "Testar o Clínica Pro Grátis",
                List.of(
                        "Domínio / Subdomínio próprio",
                        "Suporte via WhatsApp",
                        "Até 6 profissionais na agenda",
                        "Lembretes automáticos via WhatsApp (confirmação e alerta 24h antes)",
                        "Personalização completa com o logótipo da clínica",
                        "Dashboard executivo de métricas e taxa de No-Show"
                ),
                2,
                new BigDecimal("99.90"),
                new BigDecimal("539.00"),
                new BigDecimal("999.00")
        );

        criarSeAusente(
                "VIP",
                "VIP / Multisalas",
                "Para clínicas de grande porte, franquias e operações multisalas",
                false,
                null,
                "Tudo do Plano Clínica Pro +",
                "Começar no VIP / Multisalas",
                List.of(
                        "Domínio / Subdomínio próprio",
                        "Suporte prioritário via WhatsApp",
                        "Profissionais e salas ilimitadas",
                        "Campanhas de retorno no WhatsApp (reativação de clientes inativos)",
                        "Gestão avançada de múltiplos acessos e comissões"
                ),
                3,
                new BigDecimal("119.90"),
                new BigDecimal("647.00"),
                new BigDecimal("1199.00")
        );
    }

    private void criarSeAusente(
            String codigo,
            String nome,
            String subtitulo,
            boolean destaque,
            String etiquetaDestaque,
            String beneficiosBaseTexto,
            String ctaTexto,
            List<String> funcionalidades,
            int ordem,
            BigDecimal mensal,
            BigDecimal semestral,
            BigDecimal anual
    ) {
        if (planoRepository.findByCodigoIgnoreCase(codigo).isPresent()) {
            return;
        }
        String json = "[]";
        try {
            json = objectMapper.writeValueAsString(funcionalidades);
        } catch (Exception ignored) {
        }

        PlanoAssinatura p = PlanoAssinatura.builder()
                .codigo(codigo)
                .nome(nome)
                .subtitulo(subtitulo)
                .destaque(destaque)
                .etiquetaDestaque(etiquetaDestaque)
                .beneficiosBaseTexto(beneficiosBaseTexto)
                .ctaTexto(ctaTexto)
                .funcionalidadesJson(json)
                .ordemExibicao(ordem)
                .ativo(true)
                .precoMensal(mensal)
                .precoSemestral(semestral)
                .precoAnual(anual)
                .promocional(false)
                .tipoPromocao("PRIMEIRO_MES")
                .percentualDesconto(BigDecimal.ZERO)
                .atualizadoEm(LocalDateTime.now())
                .build();
        planoRepository.save(p);
    }

    @Transactional
    public List<PlanoAssinaturaDTO> listarPlanosPublicos() {
        if (planoRepository.count() == 0) {
            garantirPlanosPadrao();
        }
        return planoRepository.findAllByAtivoTrueOrderByOrdemExibicaoAsc()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public record ResolucaoPlanoCheckout(
            String planoCodigo,
            String ciclo,
            BigDecimal valorOriginal,
            BigDecimal valorFinal,
            boolean promocaoAplicada,
            String tipoPromocao,
            BigDecimal percentualDesconto,
            int mesesGarantidos,
            String descricao
    ) {}

    public boolean promocaoDisponivel(PlanoAssinatura p) {
        if (p == null || !Boolean.TRUE.equals(p.getPromocional())) return false;
        Integer lim = p.getPromocaoLimiteUsos();
        int usados = p.getPromocaoUsosAtuais() != null ? p.getPromocaoUsosAtuais() : 0;
        return lim == null || lim <= 0 || usados < lim;
    }

    @Transactional(readOnly = true)
    public BigDecimal resolverValorPadrao(String planoParam, String cicloParam) {
        String codigo = normalizarCodigo(planoParam);
        String ciclo = normalizarCiclo(cicloParam);
        return planoRepository.findByCodigoIgnoreCase(codigo)
                .map(p -> switch (ciclo) {
                    case "SEMESTRAL" -> p.getPrecoSemestral().setScale(2, RoundingMode.HALF_UP);
                    case "ANUAL" -> p.getPrecoAnual().setScale(2, RoundingMode.HALF_UP);
                    default -> p.getPrecoMensal().setScale(2, RoundingMode.HALF_UP);
                })
                .orElseGet(() -> TenantService.calcularValorPlano(codigo, ciclo));
    }

    @Transactional(readOnly = true)
    public ResolucaoPlanoCheckout resolverPromocaoCheckout(String planoParam, String cicloParam) {
        String codigo = normalizarCodigo(planoParam);
        String ciclo = normalizarCiclo(cicloParam);
        BigDecimal valorOriginal = resolverValorPadrao(codigo, ciclo);
        Optional<PlanoAssinatura> opt = planoRepository.findByCodigoIgnoreCase(codigo);
        if (opt.isEmpty()) {
            return new ResolucaoPlanoCheckout(codigo, ciclo, valorOriginal, valorOriginal, false, "PRIMEIRO_MES", BigDecimal.ZERO, 0, "Plano " + codigo);
        }
        PlanoAssinatura p = opt.get();
        boolean promo = promocaoDisponivel(p);
        String tipo = normalizarTipoPromocao(p.getTipoPromocao());
        BigDecimal pct = p.getPercentualDesconto() != null ? p.getPercentualDesconto() : BigDecimal.ZERO;
        boolean promoNoCiclo = switch (ciclo) {
            case "SEMESTRAL" -> promo && "RECORRENTE_12_MESES".equals(tipo);
            case "ANUAL" -> promo && ("RECORRENTE_12_MESES".equals(tipo) || "SOMENTE_ANUAL".equals(tipo));
            default -> promo && ("PRIMEIRO_MES".equals(tipo) || "RECORRENTE_12_MESES".equals(tipo));
        };
        BigDecimal promoValor = switch (ciclo) {
            case "SEMESTRAL" -> p.getPrecoSemestralPromocional();
            case "ANUAL" -> p.getPrecoAnualPromocional();
            default -> p.getPrecoMensalPromocional();
        };
        BigDecimal valorFinal = calcularFinal(valorOriginal, promoNoCiclo, promoValor, pct);
        boolean aplicada = promoNoCiclo && valorFinal.compareTo(valorOriginal) < 0;
        int meses = 0;
        if (aplicada) {
            meses = ("RECORRENTE_12_MESES".equals(tipo) || "SOMENTE_ANUAL".equals(tipo)) ? 12 : 1;
        }
        BigDecimal descPct = calcularDescontoPercentual(valorOriginal, calcularDescontoValor(valorOriginal, valorFinal));
        String desc = aplicada
                ? String.format("Promoção %s%% OFF (%s)", descPct.stripTrailingZeros().toPlainString(), descricaoDuracao(tipo))
                : "Plano " + p.getNome();
        return new ResolucaoPlanoCheckout(codigo, ciclo, valorOriginal, valorFinal, aplicada, tipo, descPct, meses, desc);
    }

    @Transactional
    public void registrarUsoPromocao(String planoCodigo) {
        if (planoCodigo == null || planoCodigo.isBlank()) return;
        planoRepository.incrementarUsoPromocaoAtomico(normalizarCodigo(planoCodigo));
    }

    @Transactional(readOnly = true)
    public BigDecimal resolverValorEfetivo(String planoParam, String cicloParam) {
        String codigo = normalizarCodigo(planoParam);
        String ciclo = normalizarCiclo(cicloParam);

        return planoRepository.findByCodigoIgnoreCase(codigo)
                .map(p -> {
                    boolean promo = promocaoDisponivel(p);
                    String tipo = normalizarTipoPromocao(p.getTipoPromocao());
                    BigDecimal pct = p.getPercentualDesconto();
                    return switch (ciclo) {
                        case "SEMESTRAL" -> calcularFinal(
                                p.getPrecoSemestral(),
                                promo && "RECORRENTE_12_MESES".equals(tipo),
                                p.getPrecoSemestralPromocional(),
                                pct
                        );
                        case "ANUAL" -> calcularFinal(
                                p.getPrecoAnual(),
                                promo && ("RECORRENTE_12_MESES".equals(tipo) || "SOMENTE_ANUAL".equals(tipo)),
                                p.getPrecoAnualPromocional(),
                                pct
                        );
                        default -> calcularFinal(
                                p.getPrecoMensal(),
                                promo && ("PRIMEIRO_MES".equals(tipo) || "RECORRENTE_12_MESES".equals(tipo)),
                                p.getPrecoMensalPromocional(),
                                pct
                        );
                    };
                })
                .orElseGet(() -> TenantService.calcularValorPlano(codigo, ciclo));
    }

    public static String normalizarCodigo(String plano) {
        String p = plano != null ? plano.trim().toUpperCase() : "PRO";
        return switch (p) {
            case "STARTER", "STUDIO" -> "STARTER";
            case "VIP", "MULTISALAS" -> "VIP";
            default -> "PRO";
        };
    }

    public static String normalizarCiclo(String ciclo) {
        String c = ciclo != null ? ciclo.trim().toUpperCase() : "MENSAL";
        return switch (c) {
            case "SEMESTRAL" -> "SEMESTRAL";
            case "ANUAL" -> "ANUAL";
            default -> "MENSAL";
        };
    }

    public static String normalizarTipoPromocao(String tipo) {
        String t = tipo != null ? tipo.trim().toUpperCase() : "PRIMEIRO_MES";
        if ("RECORRENTE_12_MESES".equals(t) || "ANUAL_12_MESES".equals(t)) return "RECORRENTE_12_MESES";
        if ("SOMENTE_ANUAL".equals(t) || "ANUAL".equals(t)) return "SOMENTE_ANUAL";
        return "PRIMEIRO_MES";
    }

    private String descricaoDuracao(String tipo) {
        return switch (tipo) {
            case "RECORRENTE_12_MESES" -> "Válido em todos os meses durante 12 meses";
            case "SOMENTE_ANUAL" -> "Exclusivo no plano Anual (12 meses)";
            default -> "Válido somente no 1º mês (plano mensal)";
        };
    }

    private BigDecimal calcularFinal(BigDecimal original, boolean promoNoCiclo, BigDecimal promoValor, BigDecimal pctDesconto) {
        BigDecimal orig = original != null ? original.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        if (!promoNoCiclo) {
            return orig;
        }
        if (promoValor != null && promoValor.compareTo(BigDecimal.ZERO) > 0 && promoValor.compareTo(orig) < 0) {
            return promoValor.setScale(2, RoundingMode.HALF_UP);
        }
        if (pctDesconto != null && pctDesconto.compareTo(BigDecimal.ZERO) > 0 && pctDesconto.compareTo(new BigDecimal("100")) < 0) {
            BigDecimal fator = BigDecimal.ONE.subtract(pctDesconto.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP));
            return orig.multiply(fator).setScale(2, RoundingMode.HALF_UP);
        }
        return orig;
    }

    private BigDecimal calcularDescontoValor(BigDecimal original, BigDecimal finalVal) {
        if (original == null || finalVal == null) return BigDecimal.ZERO;
        BigDecimal diff = original.subtract(finalVal).setScale(2, RoundingMode.HALF_UP);
        return diff.compareTo(BigDecimal.ZERO) > 0 ? diff : BigDecimal.ZERO;
    }

    private BigDecimal calcularDescontoPercentual(BigDecimal original, BigDecimal descontoValor) {
        if (original == null || descontoValor == null || original.compareTo(BigDecimal.ZERO) <= 0 || descontoValor.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return descontoValor.multiply(new BigDecimal("100"))
                .divide(original, 1, RoundingMode.HALF_UP);
    }

    private List<String> parseFuncionalidades(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private PlanoAssinaturaDTO toDTO(PlanoAssinatura p) {
        boolean promo = promocaoDisponivel(p);
        String tipo = normalizarTipoPromocao(p.getTipoPromocao());
        BigDecimal pct = p.getPercentualDesconto() != null ? p.getPercentualDesconto() : BigDecimal.ZERO;
        Integer limiteUsos = p.getPromocaoLimiteUsos() != null && p.getPromocaoLimiteUsos() > 0
                ? p.getPromocaoLimiteUsos()
                : null;
        int usados = p.getPromocaoUsosAtuais() != null ? p.getPromocaoUsosAtuais() : 0;
        Integer vagasRestantes = (promo && limiteUsos != null)
                ? Math.max(0, limiteUsos - usados)
                : null;

        boolean promoMensal = promo && ("PRIMEIRO_MES".equals(tipo) || "RECORRENTE_12_MESES".equals(tipo));
        boolean promoSemestral = promo && "RECORRENTE_12_MESES".equals(tipo);
        boolean promoAnual = promo && ("RECORRENTE_12_MESES".equals(tipo) || "SOMENTE_ANUAL".equals(tipo));

        BigDecimal mOrig = p.getPrecoMensal().setScale(2, RoundingMode.HALF_UP);
        BigDecimal mFinal = calcularFinal(mOrig, promoMensal, p.getPrecoMensalPromocional(), pct);
        BigDecimal mDescVal = calcularDescontoValor(mOrig, mFinal);
        BigDecimal mDescPct = calcularDescontoPercentual(mOrig, mDescVal);

        BigDecimal sOrig = p.getPrecoSemestral().setScale(2, RoundingMode.HALF_UP);
        BigDecimal sFinal = calcularFinal(sOrig, promoSemestral, p.getPrecoSemestralPromocional(), pct);
        BigDecimal sDescVal = calcularDescontoValor(sOrig, sFinal);
        BigDecimal sDescPct = calcularDescontoPercentual(sOrig, sDescVal);
        BigDecimal sMensalEq = sFinal.divide(new BigDecimal("6"), 2, RoundingMode.HALF_UP);
        BigDecimal sPoupanca = mFinal.multiply(new BigDecimal("6")).subtract(sFinal).setScale(2, RoundingMode.HALF_UP);
        if (sPoupanca.compareTo(BigDecimal.ZERO) < 0) sPoupanca = BigDecimal.ZERO;

        BigDecimal aOrig = p.getPrecoAnual().setScale(2, RoundingMode.HALF_UP);
        BigDecimal aFinal = calcularFinal(aOrig, promoAnual, p.getPrecoAnualPromocional(), pct);
        BigDecimal aDescVal = calcularDescontoValor(aOrig, aFinal);
        BigDecimal aDescPct = calcularDescontoPercentual(aOrig, aDescVal);
        BigDecimal aMensalEq = aFinal.divide(new BigDecimal("12"), 2, RoundingMode.HALF_UP);
        BigDecimal aPoupanca = mFinal.multiply(new BigDecimal("12")).subtract(aFinal).setScale(2, RoundingMode.HALF_UP);
        if (aPoupanca.compareTo(BigDecimal.ZERO) < 0) aPoupanca = BigDecimal.ZERO;

        return new PlanoAssinaturaDTO(
                p.getCodigo(),
                p.getNome(),
                p.getSubtitulo(),
                Boolean.TRUE.equals(p.getDestaque()),
                p.getEtiquetaDestaque(),
                p.getBeneficiosBaseTexto(),
                p.getCtaTexto(),
                parseFuncionalidades(p.getFuncionalidadesJson()),
                p.getOrdemExibicao(),
                mOrig,
                mFinal,
                mDescVal,
                mDescPct,
                sOrig,
                sFinal,
                sMensalEq,
                sPoupanca,
                sDescVal,
                sDescPct,
                aOrig,
                aFinal,
                aMensalEq,
                aPoupanca,
                aDescVal,
                aDescPct,
                promo,
                tipo,
                promo ? descricaoDuracao(tipo) : null,
                pct,
                p.getMensagemPromocao(),
                limiteUsos,
                usados,
                vagasRestantes
        );
    }
}
