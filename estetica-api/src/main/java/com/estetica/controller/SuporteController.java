package com.estetica.controller;

import com.estetica.dto.SuporteDTOs.*;
import com.estetica.service.SuporteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/suporte")
@RequiredArgsConstructor
@Tag(name = "Suporte e Dúvidas", description = "Envio e acompanhamento de dúvidas pelo portal público Agendoou")
public class SuporteController {

    private final SuporteService suporteService;

    @PostMapping("/chamados")
    @Operation(summary = "Abre um chamado/dúvida de suporte e gera número de protocolo")
    public ResponseEntity<SuporteChamadoDTO> criarChamado(@Valid @RequestBody CriarChamadoSuporteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(suporteService.criarChamado(request));
    }

    @GetMapping("/chamados")
    @Operation(summary = "Consulta dúvidas e respostas por protocolo ou WhatsApp")
    public ResponseEntity<List<SuporteChamadoDTO>> consultarChamados(
            @RequestParam(required = false) String protocolo,
            @RequestParam(required = false) String whatsapp) {
        return ResponseEntity.ok(suporteService.consultarChamados(protocolo, whatsapp));
    }

    @PostMapping("/chamados/{protocolo}/mensagens")
    @Operation(summary = "Envia uma nova mensagem em um protocolo já aberto")
    public ResponseEntity<SuporteChamadoDTO> responderComoCliente(
            @PathVariable String protocolo,
            @Valid @RequestBody ResponderChamadoClienteRequest request) {
        return ResponseEntity.ok(suporteService.enviarMensagemCliente(protocolo, request));
    }
}
