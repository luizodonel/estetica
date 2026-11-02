package com.estetica.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_categoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String nome;

    @Column(length = 255)
    private String descricao;

    @Column(length = 50)
    private String icone;

    @Builder.Default
    @Column(nullable = false)
    private Boolean ativo = true;

    @Column(name = "ordem_exibicao")
    private Integer ordemExibicao;
}

