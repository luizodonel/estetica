package com.estetica.service;

import com.estetica.config.JwtService;
import com.estetica.dto.AuthDTOs.UsuarioDTO;
import com.estetica.dto.TenantDTOs.*;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.ClinicaTenant;
import com.estetica.model.Role;
import com.estetica.model.Usuario;
import com.estetica.repository.ClinicaTenantRepository;
import com.estetica.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final ClinicaTenantRepository tenantRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TenantResolverService tenantResolverService;

    private static final Set<String> SLUGS_RESERVADOS = Set.of(
            "admin", "api", "www", "app", "dashboard", "mail", "portal", "estetica", "teste"
    );

    @Transactional
    public CadastroLojistaResponse cadastrarLojista(CadastroLojistaRequest request) {
        String cleanSlug = normalizarSlug(request.slug());

        if (cleanSlug.length() < 3) {
            throw new RegraNegocioException("O link exclusivo deve ter pelo menos 3 caracteres.");
        }

        if (SLUGS_RESERVADOS.contains(cleanSlug)) {
            throw new RegraNegocioException("Este link exclusivo é reservado pelo sistema. Por favor, escolha outro.");
        }

        if (tenantRepository.existsBySlugIgnoreCase(cleanSlug)) {
            throw new RegraNegocioException("O link https://" + cleanSlug + ".logistadigital.com.br/ já está em uso por outro parceiro.");
        }

        String email = request.email().toLowerCase().trim();
        if (usuarioRepository.existsByEmail(email)) {
            throw new RegraNegocioException("Já existe um cadastro com o e-mail: " + email);
        }

        // 1. Cria o Usuário Administrador do Lojista
        Usuario adminLojista = Usuario.builder()
                .nome(request.nomeResponsavel().trim())
                .email(email)
                .telefoneWhatsApp(request.telefoneWhatsApp().replaceAll("[^0-9]", ""))
                .senhaHash(passwordEncoder.encode(request.senha()))
                .role(Role.ROLE_ADMIN)
                .ativo(true)
                .build();
        adminLojista = usuarioRepository.save(adminLojista);

        // 2. Define cores e link
        String corPrimaria = (request.corPrimaria() != null && !request.corPrimaria().isBlank())
                ? request.corPrimaria().trim() : "#e11d48";
        String corSecundaria = (request.corSecundaria() != null && !request.corSecundaria().isBlank())
                ? request.corSecundaria().trim() : "#f43f5e";
        String linkPersonalizado = "https://" + cleanSlug + ".logistadigital.com.br/";

        // 3. Salva a Clínica / Loja do Parceiro
        ClinicaTenant tenant = ClinicaTenant.builder()
                .nomeEmpresa(request.nomeEmpresa().trim())
                .slug(cleanSlug)
                .linkPersonalizado(linkPersonalizado)
                .logoUrl(request.logoUrl() != null && !request.logoUrl().isBlank() ? request.logoUrl().trim() : null)
                .corPrimaria(corPrimaria)
                .corSecundaria(corSecundaria)
                .adminUsuario(adminLojista)
                .telefoneWhatsApp(request.telefoneWhatsApp().replaceAll("[^0-9]", ""))
                .ativo(true)
                .build();
        tenant = tenantRepository.save(tenant);

        // Associa o tenant ao usuário admin do lojista
        adminLojista.setTenant(tenant);
        adminLojista.setPrimeiroAcesso(false);
        usuarioRepository.save(adminLojista);

        // 4. Gera token de autenticação imediata
        String token = jwtService.gerarToken(adminLojista);

        UsuarioDTO usuarioDTO = new UsuarioDTO(
                adminLojista.getId(),
                adminLojista.getNome(),
                adminLojista.getEmail(),
                adminLojista.getTelefoneWhatsApp(),
                adminLojista.getRole(),
                adminLojista.getAtivo(),
                adminLojista.getPrimeiroAcesso()
        );

        TenantPublicDTO tenantDTO = toPublicDTO(tenant);

        return new CadastroLojistaResponse(token, linkPersonalizado, tenantDTO, usuarioDTO);
    }

    @Transactional(readOnly = true)
    public TenantPublicDTO buscarPorSlug(String slug) {
        String cleanSlug = normalizarSlug(slug);
        ClinicaTenant tenant = tenantRepository.findBySlugIgnoreCase(cleanSlug)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Loja ou clínica parceira não encontrada com o link: " + slug));
        return toPublicDTO(tenant);
    }

    @Transactional(readOnly = true)
    public boolean verificarDisponibilidadeSlug(String slug) {
        String cleanSlug = normalizarSlug(slug);
        if (cleanSlug.length() < 3 || SLUGS_RESERVADOS.contains(cleanSlug)) {
            return false;
        }
        return !tenantRepository.existsBySlugIgnoreCase(cleanSlug);
    }

    private String normalizarSlug(String slug) {
        if (slug == null) return "";
        return slug.toLowerCase().trim()
                .replace("https://", "")
                .replace("http://", "")
                .replace(".logistadigital.com.br", "")
                .replaceAll("[^a-z0-9-]", "");
    }

    public TenantPublicDTO toDTO(ClinicaTenant t) {
        return toPublicDTO(t);
    }

    private TenantPublicDTO toPublicDTO(ClinicaTenant t) {
        return new TenantPublicDTO(
                t.getId(),
                t.getNomeEmpresa(),
                t.getSlug(),
                t.getLinkPersonalizado(),
                t.getLogoUrl(),
                t.getCorPrimaria(),
                t.getCorSecundaria(),
                t.getTelefoneWhatsApp(),
                t.getBannerTag() != null ? t.getBannerTag() : "✨ Cuidado & Alta Tecnologia",
                t.getBannerTitulo() != null ? t.getBannerTitulo() : "Realce sua melhor versão com tratamentos exclusivos.",
                t.getBannerSubtitulo() != null ? t.getBannerSubtitulo() : "Protocolos personalizados, equipamentos de última geração e especialistas dedicados ao seu bem-estar e autoestima.",
                t.getBannerBotaoTexto() != null ? t.getBannerBotaoTexto() : "Agendamento Online"
        );
    }

    @Transactional
    public TenantPublicDTO atualizarBanner(AtualizarBannerRequest req) {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        if (tenant == null) {
            tenant = tenantRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Clínica não encontrada."));
        }
        if (req.bannerTag() != null) tenant.setBannerTag(req.bannerTag().trim());
        if (req.bannerTitulo() != null) tenant.setBannerTitulo(req.bannerTitulo().trim());
        if (req.bannerSubtitulo() != null) tenant.setBannerSubtitulo(req.bannerSubtitulo().trim());
        if (req.bannerBotaoTexto() != null) tenant.setBannerBotaoTexto(req.bannerBotaoTexto().trim());

        tenant = tenantRepository.save(tenant);
        return toPublicDTO(tenant);
    }
}

