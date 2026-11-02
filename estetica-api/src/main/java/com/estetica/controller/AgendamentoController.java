package com.estetica.controller;

import com.estetica.dto.AgendamentoDTOs.*;
import com.estetica.model.Role;
import com.estetica.model.Usuario;
import com.estetica.service.AgendamentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/agendamentos")
@RequiredArgsConstructor
@Tag(name = "Agendamentos", description = "Ciclo de vida de agendamentos, cancelamentos, remarcações e calendário")
public class AgendamentoController {

    private final AgendamentoService agendamentoService;

    @PostMapping
    @Operation(summary = "Criar novo agendamento com validação de concorrência/double-booking")
    public ResponseEntity<AgendamentoDTO> criar(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody CriarAgendamentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(agendamentoService.criarAgendamento(usuario.getId(), request));
    }

    @GetMapping("/meus")
    @Operation(summary = "Histórico e agendamentos futuros do cliente autenticado")
    public ResponseEntity<List<AgendamentoDTO>> listarMeus(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(agendamentoService.listarMeusAgendamentos(usuario.getId()));
    }

    @GetMapping("/calendario")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Visão geral de agendamentos por período para o calendário administrativo")
    public ResponseEntity<List<AgendamentoDTO>> calendario(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {
        return ResponseEntity.ok(agendamentoService.listarCalendarioGeral(inicio, fim, usuario));
    }

    @PostMapping("/{id}/cancelar")
    @Operation(summary = "Cancela agendamento (valida antecedência mínima de 2h para clientes)")
    public ResponseEntity<AgendamentoDTO> cancelar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) String motivo) {
        boolean isAdmin = usuario.getRole() == Role.ROLE_ADMIN || usuario.getRole() == Role.ROLE_PROFISSIONAL;
        return ResponseEntity.ok(agendamentoService.cancelarAgendamento(id, usuario.getId(), isAdmin, motivo));
    }

    @PutMapping("/{id}/remarcar")
    @Operation(summary = "Remarca agendamento para nova data/horário/profissional")
    public ResponseEntity<AgendamentoDTO> remarcar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody RemarcarAgendamentoRequest request) {
        boolean isAdmin = usuario.getRole() == Role.ROLE_ADMIN || usuario.getRole() == Role.ROLE_PROFISSIONAL;
        return ResponseEntity.ok(agendamentoService.remarcarAgendamento(id, usuario.getId(), isAdmin, request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Atualiza status operacional (CONFIRMADO, CONCLUÍDO, CANCELADO, NO_SHOW)")
    public ResponseEntity<AgendamentoDTO> atualizarStatus(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarStatusRequest request) {
        return ResponseEntity.ok(agendamentoService.atualizarStatusOperacional(id, request));
    }
}

