package com.estetica.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_rede_social_conexao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedeSocialConexao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private ClinicaTenant tenant;

    @Column(nullable = false, length = 30)
    private String plataforma; // INSTAGRAM

    @Column(name = "ig_user_id", length = 100)
    private String igUserId;

    @Column(name = "ig_username", length = 120)
    private String igUsername;

    @Column(name = "ig_name", length = 160)
    private String igName;

    @Column(name = "ig_account_type", length = 50)
    private String igAccountType;

    @Column(name = "ig_profile_picture_url", columnDefinition = "TEXT")
    private String igProfilePictureUrl;

    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    @Column(name = "token_expira_em")
    private LocalDateTime tokenExpiraEm;

    @Builder.Default
    @Column(nullable = false)
    private Boolean ativo = true;

    @CreationTimestamp
    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;
}
