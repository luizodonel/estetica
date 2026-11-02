package com.estetica.controller;

import com.estetica.dto.ProfissionalDTOs.*;
import com.estetica.service.ProfissionalService;
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
@RequestMapping("/api/v1/profissionais")
@RequiredArgsConstructor
@Tag(name = "Profissionais & Escalas", description = "Gestão de equipe, especialidades e escalas de atendimento")
public class ProfissionalController {

    private final ProfissionalService profissionalService;

    @GetMapping
    @Operation(summary = "Lista profissionais ativos")
    public ResponseEntity<List<ProfissionalDTO>> listar(
            @RequestParam(required = false) Long procedimentoId) {
        if (procedimentoId != null && procedimentoId > 0) {
            return ResponseEntity.ok(profissionalService.listarHabilitados(procedimentoId));
        }
        return ResponseEntity.ok(profissionalService.listarTodos());
    }

    @GetMapping("/todos")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lista todos os profissionais (ativos e inativos) para gestão")
    public ResponseEntity<List<ProfissionalDTO>> listarTodosAdmin() {
        return ResponseEntity.ok(profissionalService.listarTodosAdmin());
    }

    @GetMapping("/{id}/jornada")
    @Operation(summary = "Lista horários de trabalho e jornada semanal de um profissional")
    public ResponseEntity<List<HorarioTrabalhoDTO>> jornada(@PathVariable Long id) {
        return ResponseEntity.ok(profissionalService.listarJornada(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cadastra novo profissional e cria usuário correspondente (Apenas Administrador)")
    public ResponseEntity<ProfissionalDTO> criar(@Valid @RequestBody CriarProfissionalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(profissionalService.criarProfissional(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualiza dados de um profissional (Apenas Administrador)")
    public ResponseEntity<ProfissionalDTO> atualizar(@PathVariable Long id, @Valid @RequestBody CriarProfissionalRequest request) {
        return ResponseEntity.ok(profissionalService.atualizarProfissional(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Alterna status ativo/inativo do profissional (Apenas Administrador)")
    public ResponseEntity<Void> alternarStatus(@PathVariable Long id) {
        profissionalService.alternarStatus(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/jornada")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Configura os dias da semana e horários de atendimento do especialista")
    public ResponseEntity<List<HorarioTrabalhoDTO>> salvarJornada(
            @PathVariable Long id,
            @RequestBody List<SalvarJornadaItemRequest> itens) {
        return ResponseEntity.ok(profissionalService.salvarJornada(id, itens));
    }

    @GetMapping("/{id}/bloqueios")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Lista os períodos e horários bloqueados na agenda do especialista")
    public ResponseEntity<List<BloqueioAgendaDTO>> listarBloqueios(@PathVariable Long id) {
        return ResponseEntity.ok(profissionalService.listarBloqueios(id));
    }

    @PostMapping("/{id}/bloqueios")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Trava a agenda do especialista em uma data/horário específico")
    public ResponseEntity<BloqueioAgendaDTO> criarBloqueio(
            @PathVariable Long id,
            @RequestBody CriarBloqueioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(profissionalService.criarBloqueio(id, request));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PROFISSIONAL')")
    @Operation(summary = "Retorna o perfil do especialista autenticado")
    public ResponseEntity<ProfissionalDTO> meuPerfil(@org.springframework.security.core.annotation.AuthenticationPrincipal com.estetica.model.Usuario usuario) {
        return ResponseEntity.ok(profissionalService.obterMeuPerfil(usuario));
    }

    @DeleteMapping("/bloqueios/{bloqueioId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Destrava a agenda removendo o bloqueio de horário")
    public ResponseEntity<Void> removerBloqueio(@PathVariable Long bloqueioId) {
        profissionalService.removerBloqueio(bloqueioId);
        return ResponseEntity.noContent().build();
    }
}

