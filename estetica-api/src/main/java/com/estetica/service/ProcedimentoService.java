package com.estetica.service;

import com.estetica.dto.ProcedimentoDTOs.*;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.model.Categoria;
import com.estetica.model.ClinicaTenant;
import com.estetica.model.Procedimento;
import com.estetica.repository.CategoriaRepository;
import com.estetica.repository.ProcedimentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProcedimentoService {

    private final ProcedimentoRepository procedimentoRepository;
    private final CategoriaRepository categoriaRepository;
    private final TenantResolverService tenantResolverService;

    @Transactional(readOnly = true)
    public List<CategoriaDTO> listarCategorias() {
        return categoriaRepository.findByAtivoTrueOrderByOrdemExibicaoAsc()
                .stream()
                .map(c -> new CategoriaDTO(c.getId(), c.getNome(), c.getDescricao(), c.getIcone(), c.getAtivo(), c.getOrdemExibicao()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProcedimentoDTO> listarProcedimentos(Long categoriaId) {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        Long tenantId = tenant != null ? tenant.getId() : null;

        List<Procedimento> list;
        if (tenantId != null) {
            list = (categoriaId != null && categoriaId > 0)
                    ? procedimentoRepository.findByTenantIdAndCategoriaIdAndAtivoTrueOrderByTituloAsc(tenantId, categoriaId)
                    : procedimentoRepository.findByTenantIdAndAtivoTrueOrderByTituloAsc(tenantId);
        } else {
            list = (categoriaId != null && categoriaId > 0)
                    ? procedimentoRepository.findByCategoriaIdAndAtivoTrueOrderByTituloAsc(categoriaId)
                    : procedimentoRepository.findByAtivoTrueOrderByTituloAsc();
        }

        return list.stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ProcedimentoDTO> listarTodosAdmin() {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        List<Procedimento> list = (tenant != null)
                ? procedimentoRepository.findByTenantIdOrderByTituloAsc(tenant.getId())
                : procedimentoRepository.findAll();

        return list.stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public ProcedimentoDTO buscarPorId(Long id) {
        Procedimento p = procedimentoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Procedimento não encontrado com ID: " + id));
        return toDTO(p);
    }

    @Transactional
    public ProcedimentoDTO criarProcedimento(CriarProcedimentoRequest request) {
        Categoria cat = categoriaRepository.findById(request.categoriaId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada com ID: " + request.categoriaId()));

        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();

        Procedimento p = Procedimento.builder()
                .categoria(cat)
                .tenant(tenant)
                .titulo(request.titulo().trim())
                .descricao(request.descricao())
                .duracaoMinutos(request.duracaoMinutos())
                .preco(request.preco())
                .imagemUrl(request.imagemUrl())
                .ativo(true)
                .build();

        p = procedimentoRepository.save(p);
        return toDTO(p);
    }

    @Transactional
    public ProcedimentoDTO atualizarProcedimento(Long id, CriarProcedimentoRequest request) {
        Procedimento p = procedimentoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Procedimento não encontrado com ID: " + id));

        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        if (tenant != null && p.getTenant() != null && !p.getTenant().getId().equals(tenant.getId())) {
            throw new com.estetica.exception.RegraNegocioException("Acesso negado: Este procedimento pertence a outra clínica.");
        }

        Categoria cat = categoriaRepository.findById(request.categoriaId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada com ID: " + request.categoriaId()));

        p.setCategoria(cat);
        p.setTitulo(request.titulo().trim());
        p.setDescricao(request.descricao());
        p.setDuracaoMinutos(request.duracaoMinutos());
        p.setPreco(request.preco());
        p.setImagemUrl(request.imagemUrl());

        p = procedimentoRepository.save(p);
        return toDTO(p);
    }

    @Transactional
    public void alternarStatus(Long id) {
        Procedimento p = procedimentoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Procedimento não encontrado com ID: " + id));
        p.setAtivo(!Boolean.TRUE.equals(p.getAtivo()));
        procedimentoRepository.save(p);
    }

    private ProcedimentoDTO toDTO(Procedimento p) {
        return new ProcedimentoDTO(
                p.getId(),
                p.getCategoria().getId(),
                p.getCategoria().getNome(),
                p.getTitulo(),
                p.getDescricao(),
                p.getDuracaoMinutos(),
                p.getPreco(),
                p.getImagemUrl(),
                p.getAtivo()
        );
    }
}

