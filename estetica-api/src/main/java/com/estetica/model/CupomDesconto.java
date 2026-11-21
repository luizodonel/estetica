package com.estetica.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_cupom_desconto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CupomDesconto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String codigo;

    @Column(length = 255)
    private String descricao;

    @Builder.Default
    @Column(name = "tipo_desconto", nullable = false, length = 20)
    private String tipoDesconto = "PERCENTUAL";

    @Column(name = "valor_desconto", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorDesconto;

    @Builder.Default
    @Column(name = "duracao_meses", nullable = false)
    private Integer duracaoMeses = 1;

    @Builder.Default
    @Column(name = "plano_aplicavel", nullable = false, length = 30)
    private String planoAplicavel = "TODOS";

    @Builder.Default
    @Column(name = "ciclo_aplicavel", nullable = false, length = 30)
    private String cicloAplicavel = "TODOS";

    @Column(name = "limite_usos")
    private Integer limiteUsos;

    @Builder.Default
    @Column(name = "usos_atuais", nullable = false)
    private Integer usosAtuais = 0;

    @Column(name = "valido_ate")
    private LocalDateTime validoAte;

    @Builder.Default
    @Column(nullable = false)
    private Boolean ativo = true;

    @Builder.Default
    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    @Builder.Default
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm = LocalDateTime.now();
}
