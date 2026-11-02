package com.estetica.controller;

import com.estetica.dto.DisponibilidadeDTOs.DisponibilidadeResponseDTO;
import com.estetica.service.DisponibilidadeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/disponibilidade")
@RequiredArgsConstructor
@Tag(name = "Disponibilidade & Slots", description = "Motor de cálculo dinâmico de horários livres em tempo real")
public class DisponibilidadeController {

    private final DisponibilidadeService disponibilidadeService;

    @GetMapping("/slots")
    @Operation(summary = "Calcula horários livres para uma data, procedimento e profissional (ou qualquer)")
    public ResponseEntity<DisponibilidadeResponseDTO> obterSlots(
            @RequestParam Long procedimentoId,
            @RequestParam(required = false) Long profissionalId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return ResponseEntity.ok(disponibilidadeService.calcularSlots(procedimentoId, profissionalId, data));
    }
}

