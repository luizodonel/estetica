package com.estetica.controller;

import com.estetica.dto.SuporteDTOs.*;
import com.estetica.service.SuporteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/suporte")
@RequiredArgsConstructor
@Tag(name = "Suporte e Dúvidas", description = "Envio de dúvidas e atendimento privado autenticado")
public class SuporteController {

    private final SuporteService suporteService;

    @PostMapping("/chamados")
    @Operation(summary = "Abre um chamado/dúvida de suporte (público para visitante com resposta no WhatsApp, ou vinculado ao lojista autenticado)")
    public ResponseEntity<SuporteChamadoDTO> criarChamado(
            @Valid @RequestBody CriarChamadoSuporteRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(suporteService.criarChamado(request, authentication));
    }

    @GetMapping("/meus-chamados")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lista exclusivamente os chamados e mensagens pertencentes ao usuário/lojista autenticado")
    public ResponseEntity<List<SuporteChamadoDTO>> listarMeusChamados(Authentication authentication) {
        return ResponseEntity.ok(suporteService.listarMeusChamados(authentication));
    }

    @PostMapping("/meus-chamados/{id}/mensagens")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Envia uma nova mensagem em um chamado pertencente exclusivamente ao usuário/lojista autenticado")
    public ResponseEntity<SuporteChamadoDTO> enviarMensagemNoMeuChamado(
            @PathVariable Long id,
            @Valid @RequestBody ResponderChamadoClienteRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(suporteService.enviarMensagemNoMeuChamado(id, request, authentication));
    }
}
