package com.estetica.controller;

import com.estetica.dto.RelatorioDTOs.RelatorioGeralResponse;
import com.estetica.model.StatusAgendamento;
import com.estetica.service.RelatorioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/relatorios")
@RequiredArgsConstructor
@Tag(name = "Relatórios", description = "Relatórios operacionais e financeiros por especialista")
public class RelatorioController {

    private final RelatorioService relatorioService;

    @GetMapping("/especialistas")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Gera relatório financeiro e operacional de especialistas com procedimentos, dias e horários")
    public ResponseEntity<RelatorioGeralResponse> relatorioEspecialistas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) Long profissionalId,
            @RequestParam(required = false) StatusAgendamento status) {
        return ResponseEntity.ok(relatorioService.gerarRelatorio(dataInicio, dataFim, profissionalId, status));
    }
}
