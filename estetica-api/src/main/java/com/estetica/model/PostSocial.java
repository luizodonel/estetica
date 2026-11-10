package com.estetica.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_post_social")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostSocial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private ClinicaTenant tenant;

    @Column(nullable = false, length = 30)
    private String plataforma; // INSTAGRAM

    @Column(name = "tipo_midia", nullable = false, length = 20)
    private String tipoMidia; // FEED ou STORIES

    @Column(name = "imagem_url", nullable = false, columnDefinition = "TEXT")
    private String imagemUrl;

    @Column(columnDefinition = "TEXT")
    private String legenda;

    @Column(name = "ig_media_id", length = 120)
    private String igMediaId;

    @Column(columnDefinition = "TEXT")
    private String permalink;

    @Column(nullable = false, length = 30)
    private String status; // PUBLICADO ou ERRO

    @Column(name = "mensagem_erro", columnDefinition = "TEXT")
    private String mensagemErro;

    @Column(name = "publicado_em")
    private LocalDateTime publicadoEm;

    @CreationTimestamp
    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;
}
