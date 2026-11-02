package com.estetica.controller;

import com.estetica.dto.TenantDTOs.*;
import com.estetica.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/onboarding")
@RequiredArgsConstructor
@Tag(name = "Onboarding de Lojistas / Parceiros", description = "Cadastro exclusivo e configuração de lojas whitelabel")
public class TenantController {

    private final TenantService tenantService;

    @PostMapping("/lojista")
    @Operation(summary = "Cadastro exclusivo de novo lojista / clínica parceira com link personalizado e whitelabel")
    public ResponseEntity<CadastroLojistaResponse> cadastrarLojista(@Valid @RequestBody CadastroLojistaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tenantService.cadastrarLojista(request));
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
