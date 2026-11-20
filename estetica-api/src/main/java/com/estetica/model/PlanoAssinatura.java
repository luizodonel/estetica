package com.estetica.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_plano_assinatura")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanoAssinatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String codigo;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 255)
    private String subtitulo;

    @Builder.Default
    @Column(nullable = false)
    private Boolean destaque = false;

    @Column(name = "etiqueta_destaque", length = 120)
    private String etiquetaDestaque;

    @Column(name = "beneficios_base_texto", length = 120)
    private String beneficiosBaseTexto;

    @Column(name = "cta_texto", length = 120)
    private String ctaTexto;

    @Column(name = "funcionalidades_json", columnDefinition = "TEXT")
    private String funcionalidadesJson;

    @Builder.Default
    @Column(name = "ordem_exibicao", nullable = false)
    private Integer ordemExibicao = 1;

    @Builder.Default
    @Column(nullable = false)
    private Boolean ativo = true;

    @Column(name = "preco_mensal", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoMensal;

    @Column(name = "preco_semestral", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoSemestral;

    @Column(name = "preco_anual", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoAnual;

    @Builder.Default
    @Column(nullable = false)
    private Boolean promocional = false;

    @Builder.Default
    @Column(name = "percentual_desconto", nullable = false, precision = 5, scale = 2)
    private BigDecimal percentualDesconto = BigDecimal.ZERO;

    @Column(name = "preco_mensal_promocional", precision = 10, scale = 2)
    private BigDecimal precoMensalPromocional;

    @Column(name = "preco_semestral_promocional", precision = 10, scale = 2)
    private BigDecimal precoSemestralPromocional;

    @Column(name = "preco_anual_promocional", precision = 10, scale = 2)
    private BigDecimal precoAnualPromocional;

    @Column(name = "mensagem_promocao", length = 255)
    private String mensagemPromocao;

    @Builder.Default
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm = LocalDateTime.now();
}
