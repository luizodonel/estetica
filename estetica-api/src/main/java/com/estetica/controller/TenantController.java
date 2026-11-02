package com.estetica.controller;

import com.estetica.dto.TenantDTOs.*;
import com.estetica.model.ClinicaTenant;
import com.estetica.repository.ClinicaTenantRepository;
import com.estetica.service.TenantResolverService;
import com.estetica.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/onboarding")
@RequiredArgsConstructor
@Tag(name = "Onboarding de Lojistas / Parceiros", description = "Cadastro exclusivo e configuração de lojas whitelabel")
public class TenantController {

    private final TenantService tenantService;
    private final TenantResolverService tenantResolverService;
    private final ClinicaTenantRepository tenantRepository;

    @PostMapping("/lojista")
    @Operation(summary = "Cadastro exclusivo de novo lojista / clínica parceira com link personalizado e whitelabel")
    public ResponseEntity<CadastroLojistaResponse> cadastrarLojista(@Valid @RequestBody CadastroLojistaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tenantService.cadastrarLojista(request));
    }

    @GetMapping("/meu-tenant")
    @Operation(summary = "Recupera dados públicos e banner da clínica atual")
    public ResponseEntity<TenantPublicDTO> obterMeuTenant() {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        if (tenant == null) {
            tenant = tenantRepository.findAll().stream().findFirst().orElse(null);
        }
        if (tenant == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(tenantService.toDTO(tenant));
    }

    @PutMapping("/banner")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualiza textos e chamada do banner da clínica pelo lojista")
    public ResponseEntity<TenantPublicDTO> atualizarBanner(@RequestBody AtualizarBannerRequest request) {
        return ResponseEntity.ok(tenantService.atualizarBanner(request));
    }

    @GetMapping("/tenant/{slug}")
    @Operation(summary = "Recupera dados públicos de personalização (logo, cores, nome) pelo subdomínio / slug")
    public ResponseEntity<TenantPublicDTO> buscarPorSlug(@PathVariable String slug) {
        return ResponseEntity.ok(tenantService.buscarPorSlug(slug));
    }

    @GetMapping("/verificar-slug")
    @Operation(summary = "Verifica se um subdomínio/link personalizado está disponível")
    public ResponseEntity<Map<String, Boolean>> verificarSlug(@RequestParam String slug) {
        boolean disponivel = tenantService.verificarDisponibilidadeSlug(slug);
        return ResponseEntity.ok(Map.of("disponivel", disponivel));
    }
}

