package com.estetica.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_clinica_tenant")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicaTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome_empresa", nullable = false, length = 120)
    private String nomeEmpresa;

    @Enumerated(EnumType.STRING)
    @Column(name = "setor", length = 50)
    @Builder.Default
    private SetorAtuacao setor = SetorAtuacao.CLINICA_ESTETICA;

    @Column(nullable = false, unique = true, length = 80)
    private String slug; // Ex: "belavida" -> https://belavida.logistadigital.com.br/

    @Column(name = "link_personalizado", length = 255)
    private String linkPersonalizado;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "cor_primaria", length = 30)
    private String corPrimaria; // Ex: #e11d48

    @Column(name = "cor_secundaria", length = 30)
    private String corSecundaria; // Ex: #f43f5e

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_usuario_id")
    private Usuario adminUsuario;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lojista_id")
    private Lojista lojista;

    @Column(name = "telefone_whatsapp", length = 50)
    private String telefoneWhatsApp;

    @Column(name = "banner_tag", length = 100)
    private String bannerTag;

    @Column(name = "banner_titulo", length = 255)
    private String bannerTitulo;

    @Column(name = "banner_subtitulo", columnDefinition = "TEXT")
    private String bannerSubtitulo;

    @Column(name = "banner_botao_texto", length = 80)
    private String bannerBotaoTexto;

    @Builder.Default
    @Column(name = "status_pagamento", length = 30)
    private String statusPagamento = "PENDENTE";

    @Column(name = "mercado_pago_payment_id", length = 100)
    private String mercadoPagoPaymentId;

    @Column(name = "pix_copia_cola", columnDefinition = "TEXT")
    private String pixCopiaCola;

    @Column(name = "pix_qr_code_base64", columnDefinition = "TEXT")
    private String pixQrCodeBase64;

    @Builder.Default
    @Column(name = "valor_adesao")
    private java.math.BigDecimal valorAdesao = new java.math.BigDecimal("149.90");

    @Column(name = "data_pagamento")
    private LocalDateTime dataPagamento;

    @Column(name = "data_vencimento")
    private LocalDateTime dataVencimento;

    @Column(name = "renovacao_payment_id", length = 100)
    private String renovacaoPaymentId;

    @Column(name = "renovacao_pix_copia_cola", columnDefinition = "TEXT")
    private String renovacaoPixCopiaCola;

    @Column(name = "renovacao_pix_qr_code_base64", columnDefinition = "TEXT")
    private String renovacaoPixQrCodeBase64;

    @Column(name = "renovacao_criada_em")
    private LocalDateTime renovacaoCriadaEm;

    @Builder.Default
    @Column(nullable = false)
    private Boolean ativo = true;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;
}

