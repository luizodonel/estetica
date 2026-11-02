package com.estetica.exception;

import lombok.Getter;
import java.math.BigDecimal;

@Getter
public class PagamentoPendenteException extends RuntimeException {

    private final String paymentId;
    private final String pixCopiaCola;
    private final String pixQrCodeBase64;
    private final BigDecimal valor;

    public PagamentoPendenteException(String message, String paymentId, String pixCopiaCola, String pixQrCodeBase64, BigDecimal valor) {
        super(message);
        this.paymentId = paymentId;
        this.pixCopiaCola = pixCopiaCola;
        this.pixQrCodeBase64 = pixQrCodeBase64;
        this.valor = valor;
    }
}

