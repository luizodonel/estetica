package com.estetica.controller;

import com.estetica.dto.RedeSocialDTOs.*;
import com.estetica.service.InstagramService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/redes-sociais")
@RequiredArgsConstructor
@Tag(name = "Redes Sociais (Instagram)", description = "Conexão OAuth e publicação automática de banners no Instagram")
public class RedeSocialController {

    private final InstagramService instagramService;

    @GetMapping("/instagram/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Retorna status da conexão com o Instagram e histórico de publicações")
    public ResponseEntity<InstagramStatusResponse> statusInstagram() {
        return ResponseEntity.ok(instagramService.obterStatus());
    }

    @GetMapping("/instagram/auth-url")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Gera a URL oficial de autorização OAuth do Instagram para o lojista")
    public ResponseEntity<AuthUrlResponse> authUrl(@RequestParam(required = false) String origin) {
        return ResponseEntity.ok(instagramService.gerarAuthUrl(origin));
    }

    @GetMapping("/instagram/callback")
    @Operation(summary = "Callback OAuth do Instagram (redireciona para o painel do lojista)")
    public ResponseEntity<Void> callbackInstagram(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(name = "error_description", required = false) String errorDescription) {
        String destino = instagramService.processarCallback(code, state, error, errorDescription);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(destino));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @PostMapping("/instagram/desconectar")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desconecta a conta do Instagram do estabelecimento")
    public ResponseEntity<Void> desconectarInstagram() {
        instagramService.desconectar();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/instagram/publicar")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Publica foto ou banner diretamente no Feed ou Stories do Instagram conectado")
    public ResponseEntity<PostSocialDTO> publicarInstagram(@Valid @RequestBody PublicarInstagramRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(instagramService.publicar(request));
    }

    @PostMapping(value = "/instagram/deauthorize", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @Operation(summary = "Callback da Meta quando usuário revoga permissões do App")
    public ResponseEntity<Map<String, String>> deauthorize(@RequestParam(name = "signed_request", required = false) String signedRequest) {
        return ResponseEntity.ok(instagramService.processarExclusaoDadosMeta(signedRequest));
    }

    @PostMapping(value = "/instagram/data-deletion", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @Operation(summary = "Callback obrigatório da Meta para solicitação de exclusão de dados do usuário")
    public ResponseEntity<Map<String, String>> dataDeletion(@RequestParam(name = "signed_request", required = false) String signedRequest) {
        return ResponseEntity.ok(instagramService.processarExclusaoDadosMeta(signedRequest));
    }
}
