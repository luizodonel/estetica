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

    @Transactional(readOnly = true)
    public BigDecimal resolverValorEfetivo(String planoParam, String cicloParam) {
        String codigo = normalizarCodigo(planoParam);
        String ciclo = normalizarCiclo(cicloParam);

        return planoRepository.findByCodigoIgnoreCase(codigo)
                .map(p -> {
                    boolean promo = Boolean.TRUE.equals(p.getPromocional());
                    BigDecimal pct = p.getPercentualDesconto();
                    return switch (ciclo) {
                        case "SEMESTRAL" -> calcularFinal(p.getPrecoSemestral(), promo, p.getPrecoSemestralPromocional(), pct);
                        case "ANUAL" -> calcularFinal(p.getPrecoAnual(), promo, p.getPrecoAnualPromocional(), pct);
                        default -> calcularFinal(p.getPrecoMensal(), promo, p.getPrecoMensalPromocional(), pct);
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

    private BigDecimal calcularFinal(BigDecimal original, boolean promocional, BigDecimal promoValor, BigDecimal pctDesconto) {
        BigDecimal orig = original != null ? original.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        if (!promocional) {
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
        boolean promo = Boolean.TRUE.equals(p.getPromocional());
        BigDecimal pct = p.getPercentualDesconto() != null ? p.getPercentualDesconto() : BigDecimal.ZERO;

        BigDecimal mOrig = p.getPrecoMensal().setScale(2, RoundingMode.HALF_UP);
        BigDecimal mFinal = calcularFinal(mOrig, promo, p.getPrecoMensalPromocional(), pct);
        BigDecimal mDescVal = calcularDescontoValor(mOrig, mFinal);
        BigDecimal mDescPct = calcularDescontoPercentual(mOrig, mDescVal);

        BigDecimal sOrig = p.getPrecoSemestral().setScale(2, RoundingMode.HALF_UP);
        BigDecimal sFinal = calcularFinal(sOrig, promo, p.getPrecoSemestralPromocional(), pct);
        BigDecimal sDescVal = calcularDescontoValor(sOrig, sFinal);
        BigDecimal sDescPct = calcularDescontoPercentual(sOrig, sDescVal);
        BigDecimal sMensalEq = sFinal.divide(new BigDecimal("6"), 2, RoundingMode.HALF_UP);
        BigDecimal sPoupanca = mFinal.multiply(new BigDecimal("6")).subtract(sFinal).setScale(2, RoundingMode.HALF_UP);
        if (sPoupanca.compareTo(BigDecimal.ZERO) < 0) sPoupanca = BigDecimal.ZERO;

        BigDecimal aOrig = p.getPrecoAnual().setScale(2, RoundingMode.HALF_UP);
        BigDecimal aFinal = calcularFinal(aOrig, promo, p.getPrecoAnualPromocional(), pct);
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
                pct,
                p.getMensagemPromocao()
        );
    }
}
