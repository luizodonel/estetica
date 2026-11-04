package com.estetica.service;

import com.estetica.model.ClinicaTenant;
import com.estetica.model.Role;
import com.estetica.model.Usuario;
import com.estetica.repository.ClinicaTenantRepository;
import com.estetica.repository.ProfissionalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TenantResolverService {

    private final ClinicaTenantRepository tenantRepository;
    private final ProfissionalRepository profissionalRepository;
    private final jakarta.servlet.http.HttpServletRequest httpServletRequest;

    public ClinicaTenant getTenantDoUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            if (auth.getPrincipal() instanceof com.estetica.model.Lojista lojista) {
                return tenantRepository.findBySlugIgnoreCase(lojista.getSlug()).orElse(null);
            }

            if (auth.getPrincipal() instanceof Usuario usuario) {
                if (usuario.getTenant() != null) {
                    return usuario.getTenant();
                }

                if (usuario.getRole() == Role.ROLE_ADMIN) {
                    Optional<ClinicaTenant> tenantOpt = tenantRepository.findByAdminUsuarioId(usuario.getId());
                    if (tenantOpt.isPresent()) {
                        return tenantOpt.get();
                    }
                }

                if (usuario.getRole() == Role.ROLE_PROFISSIONAL) {
                    Optional<ClinicaTenant> tenantOpt = profissionalRepository.findByUsuarioId(usuario.getId())
                            .map(com.estetica.model.Profissional::getTenant);
                    if (tenantOpt.isPresent()) {
                        return tenantOpt.get();
                    }
                }
            }
        }

        // Tenta resolver pelo host/domínio da requisição HTTP pública
        String slugRequisicao = extrairSlugDaRequisicaoHttp();
        if (slugRequisicao != null && !slugRequisicao.isBlank()) {
            Optional<ClinicaTenant> tenantOpt = tenantRepository.findBySlugIgnoreCase(slugRequisicao);
            if (tenantOpt.isPresent()) {
                return tenantOpt.get();
            }
        }

        // Fallback: tenant padrão 'estetica' ou primeiro tenant
        return tenantRepository.findBySlugIgnoreCase("estetica")
                .or(() -> tenantRepository.findAll().stream().findFirst())
                .orElse(null);
    }

    public ClinicaTenant resolverTenantPorSlugOuAutenticado(String slug) {
        if (slug != null && !slug.isBlank()) {
            Optional<ClinicaTenant> tenantOpt = tenantRepository.findBySlugIgnoreCase(slug.trim());
            if (tenantOpt.isPresent()) {
                return tenantOpt.get();
            }
        }
        return getTenantDoUsuarioAutenticado();
    }

    public String extrairSlugDaRequisicaoHttp() {
        if (httpServletRequest == null) return null;
        try {
            String host = httpServletRequest.getHeader("X-Forwarded-Host");
            if (host == null || host.isBlank()) {
                host = httpServletRequest.getHeader("Host");
            }
            if (host == null || host.isBlank()) {
                host = httpServletRequest.getHeader("Origin");
            }
            if (host == null) return null;

            host = host.toLowerCase().trim()
                    .replace("https://", "")
                    .replace("http://", "");

            int slashIdx = host.indexOf('/');
            if (slashIdx >= 0) host = host.substring(0, slashIdx);

            int colonIdx = host.indexOf(':');
            if (colonIdx >= 0) host = host.substring(0, colonIdx);

            if (host.endsWith(".logistadigital.com.br")) {
                String sub = host.substring(0, host.indexOf(".logistadigital.com.br")).trim();
                return sub.isBlank() ? "estetica" : sub;
            }

            if (host.equals("logistadigital.com.br") || host.equals("estetica.local")) {
                return "estetica";
            }

            if (!host.equals("localhost") && !host.equals("127.0.0.1") && !host.matches("^\\d+\\.\\d+\\.\\d+\\.\\d+$")) {
                return host;
            }
        } catch (Exception ignored) {}
        return null;
    }
}

