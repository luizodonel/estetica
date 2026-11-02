package com.estetica.controller;

import com.estetica.dto.ProntuarioDTOs.*;
import com.estetica.service.ProntuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/prontuarios")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
@Tag(name = "Prontuários & Anamnese", description = "Histórico clínico, fichas e notas de atendimento dos clientes")
public class ProntuarioController {

    private final ProntuarioService prontuarioService;

    @GetMapping("/cliente/{clienteId}")
    @Operation(summary = "Obtém histórico e notas clínicas de um cliente")
    public ResponseEntity<List<HistoricoAtendimentoDTO>> buscarPorCliente(@PathVariable Long clienteId) {
        return ResponseEntity.ok(prontuarioService.buscarHistoricoPorCliente(clienteId));
    }

    @PostMapping
    @Operation(summary = "Registra nova entrada de prontuário / anamnese pós-atendimento")
    public ResponseEntity<HistoricoAtendimentoDTO> salvar(@Valid @RequestBody SalvarProntuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(prontuarioService.salvarAtendimento(request));
    }
}

