package com.estetica.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
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
    private String slug; // Ex: "belavida" -> https://belavida.agendoousistemas.com.br/

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

    @Builder.Default
    @Column(name = "horario_funcionamento", length = 150)
    private String horarioFuncionamento = "09:00 às 19:00";

    @Column(name = "cpf_cnpj", length = 30)
    private String cpfCnpj;

    @Column(name = "ip_cadastro", length = 80)
    private String ipCadastro;

    @Column(name = "device_fingerprint", length = 120)
    private String deviceFingerprint;

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

    @Column(name = "ultimo_payment_id_aprovado", length = 100)
    private String ultimoPaymentIdAprovado;

    @Builder.Default
    @Column(nullable = false)
    private Boolean ativo = true;

    @Column(name = "plano_contratado", length = 30)
    private String planoContratado;

    @Column(name = "ciclo_contratado", length = 30)
    private String cicloContratado;

    @Column(name = "beneficio_origem", length = 30)
    private String beneficioOrigem;

    @Column(name = "beneficio_codigo", length = 60)
    private String beneficioCodigo;

    @Column(name = "beneficio_descricao", length = 255)
    private String beneficioDescricao;

    @Column(name = "beneficio_tipo_desconto", length = 20)
    private String beneficioTipoDesconto;

    @Column(name = "beneficio_valor_desconto", precision = 10, scale = 2)
    private BigDecimal beneficioValorDesconto;

    @Column(name = "beneficio_valor_original", precision = 10, scale = 2)
    private BigDecimal beneficioValorOriginal;

    @Column(name = "beneficio_valor_promocional", precision = 10, scale = 2)
    private BigDecimal beneficioValorPromocional;

    @Column(name = "beneficio_meses_totais")
    private Integer beneficioMesesTotais;

    @Column(name = "beneficio_meses_restantes")
    private Integer beneficioMesesRestantes;

    @Column(name = "beneficio_ativado_em")
    private LocalDateTime beneficioAtivadoEm;

    @Column(name = "checkout_plano", length = 30)
    private String checkoutPlano;

    @Column(name = "checkout_ciclo", length = 30)
    private String checkoutCiclo;

    @Column(name = "checkout_origem", length = 30)
    private String checkoutOrigem;

    @Column(name = "checkout_cupom_codigo", length = 40)
    private String checkoutCupomCodigo;

    @Column(name = "checkout_descricao", length = 255)
    private String checkoutDescricao;

    @Column(name = "checkout_tipo_desconto", length = 20)
    private String checkoutTipoDesconto;

    @Column(name = "checkout_valor_desconto", precision = 10, scale = 2)
    private BigDecimal checkoutValorDesconto;

    @Column(name = "checkout_valor_original", precision = 10, scale = 2)
    private BigDecimal checkoutValorOriginal;

    @Column(name = "checkout_valor_final", precision = 10, scale = 2)
    private BigDecimal checkoutValorFinal;

    @Column(name = "checkout_meses_totais")
    private Integer checkoutMesesTotais;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;
}

