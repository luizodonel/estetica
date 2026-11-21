package com.estetica.service;

import com.estetica.dto.TenantDTOs.ValidarCupomResponse;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.CupomDesconto;
import com.estetica.repository.CupomDescontoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CupomDescontoService {

    private final CupomDescontoRepository cupomRepository;
    private final PlanoAssinaturaService planoAssinaturaService;

    public record CalculoCupom(
            CupomDesconto cupom,
            String planoCodigo,
            String ciclo,
            BigDecimal valorOriginal,
            BigDecimal valorDescontoAplicado,
            BigDecimal valorFinal,
            int duracaoMeses,
            String descricao
    ) {}

    @Transactional(readOnly = true)
    public ValidarCupomResponse validarECalcularCupom(String codigoRaw, String planoParam, String cicloParam) {
        String codigo = codigoRaw != null ? codigoRaw.trim().toUpperCase() : "";
        String planoCodigo = PlanoAssinaturaService.normalizarCodigo(planoParam);
        String ciclo = PlanoAssinaturaService.normalizarCiclo(cicloParam);
        BigDecimal valorOriginal = planoAssinaturaService.resolverValorPadrao(planoCodigo, ciclo);

        if (codigo.isEmpty()) {
            return erro("Informe o código do cupom.", codigo, planoCodigo, ciclo, valorOriginal);
        }

        CupomDesconto c = cupomRepository.findByCodigoIgnoreCase(codigo).orElse(null);
        if (c == null) {
            return erro("Cupom não encontrado. Verifique se o código foi digitado corretamente.", codigo, planoCodigo, ciclo, valorOriginal);
        }

        if (!Boolean.TRUE.equals(c.getAtivo())) {
            return erro("Este cupom não está mais ativo.", c.getCodigo(), planoCodigo, ciclo, valorOriginal);
        }

        if (c.getValidoAte() != null && LocalDateTime.now().isAfter(c.getValidoAte())) {
            return erro("Este cupom expirou.", c.getCodigo(), planoCodigo, ciclo, valorOriginal);
        }

        Integer limite = c.getLimiteUsos();
        int usados = c.getUsosAtuais() != null ? c.getUsosAtuais() : 0;
        if (limite != null && limite > 0 && usados >= limite) {
            return erro("Este cupom atingiu o limite máximo de participantes disponíveis.", c.getCodigo(), planoCodigo, ciclo, valorOriginal);
        }

        String planoAp = c.getPlanoAplicavel() != null ? c.getPlanoAplicavel().trim().toUpperCase() : "TODOS";
        if (!"TODOS".equals(planoAp) && !planoAp.equals(planoCodigo)) {
            return erro("Este cupom é exclusivo para o plano " + planoAp + ".", c.getCodigo(), planoCodigo, ciclo, valorOriginal);
        }

        String cicloAp = c.getCicloAplicavel() != null ? c.getCicloAplicavel().trim().toUpperCase() : "TODOS";
        if (!"TODOS".equals(cicloAp) && !cicloAp.equals(ciclo)) {
            return erro("Este cupom é exclusivo para o ciclo " + cicloAp + ".", c.getCodigo(), planoCodigo, ciclo, valorOriginal);
        }

        CalculoCupom calc = calcularValores(c, planoCodigo, ciclo, valorOriginal);
        Integer restantes = (limite != null && limite > 0) ? Math.max(0, limite - usados) : null;

        return new ValidarCupomResponse(
                true,
                "Cupom aplicado com sucesso! Desconto não cumulativo com outras promoções.",
                c.getCodigo(),
                calc.descricao(),
                c.getTipoDesconto(),
                c.getValorDesconto(),
                calc.duracaoMeses(),
                planoAp,
                cicloAp,
                calc.valorOriginal(),
                calc.valorDescontoAplicado(),
                calc.valorFinal(),
                limite,
                usados,
                restantes
        );
    }

    @Transactional(readOnly = true)
    public CalculoCupom resolverAplicacaoCupom(String codigoRaw, String planoParam, String cicloParam) {
        ValidarCupomResponse resp = validarECalcularCupom(codigoRaw, planoParam, cicloParam);
        if (!resp.valido()) {
            throw new RegraNegocioException(resp.mensagem());
        }
        CupomDesconto c = cupomRepository.findByCodigoIgnoreCase(resp.codigo())
                .orElseThrow(() -> new RegraNegocioException("Cupom não encontrado."));
        return calcularValores(c, PlanoAssinaturaService.normalizarCodigo(planoParam), PlanoAssinaturaService.normalizarCiclo(cicloParam), resp.valorOriginal());
    }

    @Transactional
    public void registrarUsoCupom(String codigo) {
        if (codigo == null || codigo.isBlank()) return;
        cupomRepository.incrementarUsoAtomico(codigo.trim().toUpperCase());
    }

    private CalculoCupom calcularValores(CupomDesconto c, String planoCodigo, String ciclo, BigDecimal valorOriginal) {
        int duracao = c.getDuracaoMeses() != null && c.getDuracaoMeses() > 0 ? c.getDuracaoMeses() : 1;
        int mesesCiclo = "ANUAL".equals(ciclo) ? 12 : ("SEMESTRAL".equals(ciclo) ? 6 : 1);
        int mesesCobertos = Math.min(mesesCiclo, duracao);

        BigDecimal valorDesc = c.getValorDesconto() != null ? c.getValorDesconto() : BigDecimal.ZERO;
        BigDecimal descontoAplicado;

        if ("VALOR_FIXO".equalsIgnoreCase(c.getTipoDesconto())) {
            descontoAplicado = valorDesc.multiply(BigDecimal.valueOf(mesesCobertos)).setScale(2, RoundingMode.HALF_UP);
        } else {
            BigDecimal pctFator = valorDesc.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP);
            BigDecimal cicloFator = BigDecimal.valueOf(mesesCobertos)
                    .divide(BigDecimal.valueOf(mesesCiclo), 6, RoundingMode.HALF_UP);
            descontoAplicado = valorOriginal.multiply(pctFator).multiply(cicloFator).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal valorFinal = valorOriginal.subtract(descontoAplicado).setScale(2, RoundingMode.HALF_UP);
        BigDecimal minimo = new BigDecimal("1.00");
        if (valorFinal.compareTo(minimo) < 0) {
            valorFinal = minimo;
            descontoAplicado = valorOriginal.subtract(minimo).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        }

        String labelDesc = "VALOR_FIXO".equalsIgnoreCase(c.getTipoDesconto())
                ? String.format("Cupom %s (-R$ %s/mês por %d %s)", c.getCodigo(), valorDesc.setScale(2, RoundingMode.HALF_UP).toPlainString(), duracao, duracao == 1 ? "mês" : "meses")
                : String.format("Cupom %s (-%s%% por %d %s)", c.getCodigo(), valorDesc.stripTrailingZeros().toPlainString(), duracao, duracao == 1 ? "mês" : "meses");
        if (c.getDescricao() != null && !c.getDescricao().isBlank()) {
            labelDesc = c.getDescricao().trim() + " (" + labelDesc + ")";
        }

        return new CalculoCupom(
                c,
                planoCodigo,
                ciclo,
                valorOriginal,
                descontoAplicado,
                valorFinal,
                duracao,
                labelDesc
        );
    }

    private ValidarCupomResponse erro(String msg, String codigo, String plano, String ciclo, BigDecimal orig) {
        return new ValidarCupomResponse(
                false,
                msg,
                codigo,
                null,
                null,
                BigDecimal.ZERO,
                0,
                plano,
                ciclo,
                orig,
                BigDecimal.ZERO,
                orig,
                null,
                null,
                null
        );
    }
}
