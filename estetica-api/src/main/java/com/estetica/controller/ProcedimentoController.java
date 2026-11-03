package com.estetica.controller;

import com.estetica.dto.ProcedimentoDTOs.*;
import com.estetica.service.ProcedimentoService;
import com.estetica.model.SetorAtuacao;
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
@RequestMapping("/api/v1/procedimentos")
@RequiredArgsConstructor
@Tag(name = "Procedimentos & Catálogo", description = "Catálogo de procedimentos estéticos por categorias")
public class ProcedimentoController {

    private final ProcedimentoService procedimentoService;

    @GetMapping("/categorias")
    @Operation(summary = "Lista categorias ativas filtradas por setor/nicho")
    public ResponseEntity<List<CategoriaDTO>> listarCategorias(
            @RequestParam(required = false) SetorAtuacao setor) {
        return ResponseEntity.ok(procedimentoService.listarCategorias(setor));
    }

    @GetMapping
    @Operation(summary = "Lista procedimentos com filtro opcional por categoria")
    public ResponseEntity<List<ProcedimentoDTO>> listarProcedimentos(
            @RequestParam(required = false) Long categoriaId) {
        return ResponseEntity.ok(procedimentoService.listarProcedimentos(categoriaId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhes de um procedimento específico")
    public ResponseEntity<ProcedimentoDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(procedimentoService.buscarPorId(id));
    }

    @GetMapping("/todos")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lista todos os procedimentos (ativos e inativos) para gestão")
    public ResponseEntity<List<ProcedimentoDTO>> listarTodosAdmin() {
        return ResponseEntity.ok(procedimentoService.listarTodosAdmin());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cadastra novo procedimento (Apenas Administrador)")
    public ResponseEntity<ProcedimentoDTO> criar(@Valid @RequestBody CriarProcedimentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(procedimentoService.criarProcedimento(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualiza procedimento existente (Apenas Administrador)")
    public ResponseEntity<ProcedimentoDTO> atualizar(@PathVariable Long id, @Valid @RequestBody CriarProcedimentoRequest request) {
        return ResponseEntity.ok(procedimentoService.atualizarProcedimento(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Alterna status ativo/inativo do procedimento (Apenas Administrador)")
    public ResponseEntity<Void> alternarStatus(@PathVariable Long id) {
        procedimentoService.alternarStatus(id);
        return ResponseEntity.noContent().build();
    }
}

