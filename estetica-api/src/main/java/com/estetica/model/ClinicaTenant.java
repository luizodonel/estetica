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

    @Column(name = "telefone_whatsapp", length = 20)
    private String telefoneWhatsApp;

    @Builder.Default
    @Column(nullable = false)
    private Boolean ativo = true;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;
}

