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

    public ClinicaTenant getTenantDoUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Usuario usuario) {
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

        // Fallback: se houver apenas um tenant cadastrado no sistema (ou acesso público)
        return tenantRepository.findAll().stream().findFirst().orElse(null);
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
}

