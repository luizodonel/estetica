package com.estetica.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_suporte_chamado")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuporteChamado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 24)
    private String protocolo;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 30)
    private String whatsapp;

    @Column(length = 160)
    private String email;

    @Column(name = "nome_empresa", length = 150)
    private String nomeEmpresa;

    @Column(nullable = false, length = 160)
    private String assunto;

    @Builder.Default
    @Column(nullable = false, length = 40)
    private String categoria = "DUVIDA";

    @Builder.Default
    @Column(nullable = false, length = 25)
    private String status = "ABERTO";

    @Builder.Default
    @Column(nullable = false, length = 40)
    private String origem = "PLANOS";

    @Builder.Default
    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    @Builder.Default
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    @Column(name = "respondido_em")
    private LocalDateTime respondidoEm;
}
