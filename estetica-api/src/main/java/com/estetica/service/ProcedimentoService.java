package com.estetica.service;

import com.estetica.dto.ProcedimentoDTOs.*;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.model.Categoria;
import com.estetica.model.ClinicaTenant;
import com.estetica.model.Procedimento;
import com.estetica.model.SetorAtuacao;
import com.estetica.repository.CategoriaRepository;
import com.estetica.repository.ProcedimentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProcedimentoService {

    private final ProcedimentoRepository procedimentoRepository;
    private final CategoriaRepository categoriaRepository;
    private final TenantResolverService tenantResolverService;

    @Transactional
    public List<CategoriaDTO> listarCategorias(SetorAtuacao setorParam) {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        SetorAtuacao setor = setorParam;
        if (setor == null && tenant != null && tenant.getSetor() != null) {
            setor = tenant.getSetor();
        }
        if (setor == null) {
            setor = SetorAtuacao.CLINICA_ESTETICA;
        }

        List<Categoria> cats;
        if (tenant != null && setorParam == null) {
            cats = categoriaRepository.findByTenantIdAndAtivoTrueOrderByOrdemExibicaoAsc(tenant.getId());
            if (cats.isEmpty()) {
                inicializarCategoriasPadraoParaTenant(tenant, setor);
                cats = categoriaRepository.findByTenantIdAndAtivoTrueOrderByOrdemExibicaoAsc(tenant.getId());
            }
        } else {
            cats = categoriaRepository.findBySetorAndAtivoTrueOrderByOrdemExibicaoAsc(setor);
            if (cats.isEmpty()) {
                inicializarCategoriasPadraoPorSetor(setor);
                cats = categoriaRepository.findBySetorAndAtivoTrueOrderByOrdemExibicaoAsc(setor);
            }
        }

        return cats.stream()
                .map(c -> new CategoriaDTO(c.getId(), c.getNome(), c.getDescricao(), c.getIcone(), c.getAtivo(), c.getOrdemExibicao()))
                .toList();
    }

    @Transactional
    public List<CategoriaDTO> listarTodasCategoriasAdmin() {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        SetorAtuacao setor = (tenant != null && tenant.getSetor() != null) ? tenant.getSetor() : SetorAtuacao.CLINICA_ESTETICA;

        List<Categoria> cats;
        if (tenant != null) {
            cats = categoriaRepository.findByTenantIdOrderByOrdemExibicaoAsc(tenant.getId());
            if (cats.isEmpty()) {
                inicializarCategoriasPadraoParaTenant(tenant, setor);
                cats = categoriaRepository.findByTenantIdOrderByOrdemExibicaoAsc(tenant.getId());
            }
        } else {
            cats = categoriaRepository.findBySetor(setor);
            if (cats.isEmpty()) {
                inicializarCategoriasPadraoPorSetor(setor);
                cats = categoriaRepository.findBySetor(setor);
            }
        }

        return cats.stream()
                .map(c -> new CategoriaDTO(c.getId(), c.getNome(), c.getDescricao(), c.getIcone(), c.getAtivo(), c.getOrdemExibicao()))
                .toList();
    }

    @Transactional
    public CategoriaDTO criarCategoria(SalvarCategoriaRequest req) {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        SetorAtuacao setor = (tenant != null && tenant.getSetor() != null) ? tenant.getSetor() : SetorAtuacao.CLINICA_ESTETICA;

        Categoria c = Categoria.builder()
                .nome(req.nome().trim())
                .descricao(req.descricao() != null ? req.descricao().trim() : null)
                .icone(req.icone() != null && !req.icone().isBlank() ? req.icone().trim() : "sparkles")
                .ordemExibicao(req.ordemExibicao() != null ? req.ordemExibicao() : 1)
                .ativo(req.ativo() != null ? req.ativo() : true)
                .setor(setor)
                .tenant(tenant)
                .build();

        c = categoriaRepository.save(c);
        log.info("[ProcedimentoService] Nova categoria '{}' criada com sucesso para o tenant {}", c.getNome(), tenant != null ? tenant.getId() : "global");
        return new CategoriaDTO(c.getId(), c.getNome(), c.getDescricao(), c.getIcone(), c.getAtivo(), c.getOrdemExibicao());
    }

    @Transactional
    public CategoriaDTO atualizarCategoria(Long id, SalvarCategoriaRequest req) {
        Categoria c = categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada com ID: " + id));

        c.setNome(req.nome().trim());
        c.setDescricao(req.descricao() != null ? req.descricao().trim() : null);
        if (req.icone() != null && !req.icone().isBlank()) {
            c.setIcone(req.icone().trim());
        }
        if (req.ativo() != null) {
            c.setAtivo(req.ativo());
        }
        if (req.ordemExibicao() != null) {
            c.setOrdemExibicao(req.ordemExibicao());
        }

        c = categoriaRepository.save(c);
        log.info("[ProcedimentoService] Categoria ID {} atualizada: '{}'", c.getId(), c.getNome());
        return new CategoriaDTO(c.getId(), c.getNome(), c.getDescricao(), c.getIcone(), c.getAtivo(), c.getOrdemExibicao());
    }

    @Transactional
    public void excluirCategoria(Long id) {
        Categoria c = categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada com ID: " + id));

        List<Procedimento> procs = procedimentoRepository.findByCategoriaIdAndAtivoTrueOrderByTituloAsc(id);
        if (!procs.isEmpty()) {
            c.setAtivo(false);
            categoriaRepository.save(c);
            log.info("[ProcedimentoService] Categoria ID {} possui procedimentos vinculados. Inativada com sucesso.", id);
        } else {
            categoriaRepository.delete(c);
            log.info("[ProcedimentoService] Categoria ID {} excluída com sucesso.", id);
        }
    }

    @Transactional
    public void inicializarCategoriasPadraoParaTenant(ClinicaTenant tenant, SetorAtuacao setor) {
        log.info("[ProcedimentoService] Inicializando categorias padrão para o tenant {} no nicho {}", tenant.getId(), setor);
        List<Categoria> modelos = categoriaRepository.findBySetorAndAtivoTrueOrderByOrdemExibicaoAsc(setor);
        if (modelos.isEmpty()) {
            inicializarCategoriasPadraoPorSetor(setor);
            modelos = categoriaRepository.findBySetorAndAtivoTrueOrderByOrdemExibicaoAsc(setor);
        }

        for (Categoria mod : modelos) {
            if (mod.getTenant() == null) {
                categoriaRepository.save(Categoria.builder()
                        .nome(mod.getNome())
                        .descricao(mod.getDescricao())
                        .icone(mod.getIcone())
                        .ordemExibicao(mod.getOrdemExibicao())
                        .ativo(true)
                        .setor(setor)
                        .tenant(tenant)
                        .build());
            }
        }
    }

    @Transactional
    public void inicializarCategoriasPadraoPorSetor(SetorAtuacao setor) {
        log.info("[ProcedimentoService] Inicializando categorias padrão para o nicho {}", setor);
        switch (setor) {
            case BARBEARIA -> {
                salvarCategoria("Corte de Cabelo", "Degradê, social, navalhado e tesoura", "scissors", 1, setor);
                salvarCategoria("Barba & Barbaterapia", "Alinhamento de barba, toalha quente e terapia", "sparkles", 2, setor);
                salvarCategoria("Cabelo & Barba", "Combo completo de corte e barba", "sparkles", 3, setor);
                salvarCategoria("Química & Pigmentação", "Platinado, luzes, reflexo e selagem", "zap", 4, setor);
                salvarCategoria("Cuidados & Acabamentos", "Sobrancelha na navalha, depilação de orelha/nariz", "heart", 5, setor);
            }
            case ESTETICA_AUTOMOTIVA -> {
                salvarCategoria("Lavagem Simples", "Ducha externa rápida e aspiração básica", "sparkles", 1, setor);
                salvarCategoria("Lavagem Completa & Detalhada", "Limpeza minuciosa de caixa de roda, motor e chassi", "sparkles", 2, setor);
                salvarCategoria("Higienização Interna", "Limpeza profunda de bancos, teto, painel e carpetes", "heart", 3, setor);
                salvarCategoria("Polimento & Cristalização", "Remoção de riscos e restauração do brilho original", "zap", 4, setor);
                salvarCategoria("Vitrificação & Proteção", "Proteção cerâmica contra intempéries e raios UV", "shield", 5, setor);
                salvarCategoria("Martelinho de Ouro & Reparos", "Remoção de amassados sem danificar a pintura", "tool", 6, setor);
            }
            case SALAO_BELEZA -> {
                salvarCategoria("Corte & Penteado", "Cortes femininos, escovas e penteados para festas", "scissors", 1, setor);
                salvarCategoria("Mechas, Coloração & Tintura", "Loiros, morena iluminada, retoque de raiz", "sparkles", 2, setor);
                salvarCategoria("Tratamentos Capilares", "Cronograma, hidratação profunda e reconstrução", "heart", 3, setor);
                salvarCategoria("Manicure & Pedicure", "Unhas tradicionais, fibra de vidro e gel", "sparkles", 4, setor);
                salvarCategoria("Maquiagem & Visagismo", "Maquiagem profissional para eventos e noivas", "sparkles", 5, setor);
                salvarCategoria("Sobrancelhas & Cílios", "Design, micropigmentação e extensão de cílios", "heart", 6, setor);
            }
            case RESTAURANTE -> {
                salvarCategoria("Salão Principal", "Mesas internas climatizadas e confortáveis", "table", 1, setor);
                salvarCategoria("Área Externa & Varanda", "Ambiente agradável e arejado ao ar livre", "sun", 2, setor);
                salvarCategoria("Mesas VIP & Reservadas", "Experiência exclusiva e intimista", "star", 3, setor);
                salvarCategoria("Experiência Gastronômica", "Menu degustação especial do chef", "utensils", 4, setor);
                salvarCategoria("Eventos & Comemorações", "Espaço reservado para aniversários e grupos", "users", 5, setor);
            }
            case DENTISTA -> {
                salvarCategoria("Avaliação & Clínico Geral", "Check-up digital, restaurações e diagnóstico", "check", 1, setor);
                salvarCategoria("Limpeza & Profilaxia", "Remoção de tártaro e aplicação de flúor", "sparkles", 2, setor);
                salvarCategoria("Clareamento Dental", "Clareamento a laser e caseiro supervisionado", "sun", 3, setor);
                salvarCategoria("Ortodontia & Alinhadores", "Aparelhos estéticos e alinhadores invisíveis", "smile", 4, setor);
                salvarCategoria("Implantes & Próteses", "Reabilitação oral e coroas definitivas", "shield", 5, setor);
            }
            case MEDICA -> {
                salvarCategoria("Consulta Médica Geral", "Atendimento clínico e check-up de rotina", "activity", 1, setor);
                salvarCategoria("Consulta Especializada", "Avaliação com especialista médico", "stethoscope", 2, setor);
                salvarCategoria("Retorno & Acompanhamento", "Reavaliação pós-tratamento e exames", "calendar", 3, setor);
                salvarCategoria("Exames Clínicos", "Exames laboratoriais e diagnósticos rápidos", "file-text", 4, setor);
                salvarCategoria("Procedimentos Ambulatoriais", "Pequenas cirurgias e suturas", "shield", 5, setor);
            }
            case TATUAGEM -> {
                salvarCategoria("Tatuagem Pequena / Fine Line", "Traços finos, escritas e artes delicadas", "edit-3", 1, setor);
                salvarCategoria("Tatuagem Média / Autoral", "Projetos exclusivos sombreados ou coloridos", "image", 2, setor);
                salvarCategoria("Fechamento (Sessão)", "Grandes projetos cobrados por sessão", "clock", 3, setor);
                salvarCategoria("Body Piercing & Joias", "Perfurações com joias de titânio assépticas", "shield", 4, setor);
                salvarCategoria("Cobertura (Cover-up)", "Revitalização e cobertura de tatuagens antigas", "refresh-cw", 5, setor);
            }
            case PSICOLOGIA -> {
                salvarCategoria("Psicoterapia Individual", "Sessões para autoconhecimento e saúde mental", "user", 1, setor);
                salvarCategoria("Terapia de Casal & Família", "Diálogo, mediação de conflitos e convivência", "users", 2, setor);
                salvarCategoria("Terapia Infantil", "Ludoterapia e orientação emocional infantil", "smile", 3, setor);
                salvarCategoria("Orientação Vocacional", "Direcionamento profissional e de carreira", "compass", 4, setor);
                salvarCategoria("Avaliação Psicológica", "Laudos e avaliações psicológicas detalhadas", "file-text", 5, setor);
            }
            case NUTRICAO -> {
                salvarCategoria("Primeira Consulta & Anamnese", "Avaliação clínica inicial e histórico alimentar", "file-text", 1, setor);
                salvarCategoria("Bioimpedância & Antropometria", "Composição corporal, percentual de gordura e músculo", "activity", 2, setor);
                salvarCategoria("Reeducação Alimentar", "Plano personalizado para emagrecimento sustentável", "heart", 3, setor);
                salvarCategoria("Nutrição Esportiva", "Foco em hipertrofia e rendimento atlético", "zap", 4, setor);
                salvarCategoria("Consulta de Retorno", "Acompanhamento periódico e ajustes de plano", "calendar", 5, setor);
            }
            case PILATES_PERSONAL -> {
                salvarCategoria("Aula Experimental", "Avaliação física e primeiros contatos com os aparelhos", "star", 1, setor);
                salvarCategoria("Pilates em Aparelhos", "Reformer, Cadillac, Chair e Barrel em pequenos grupos", "activity", 2, setor);
                salvarCategoria("Personal Trainer Individual", "Treinamento sob medida com acompanhamento 1 a 1", "user", 3, setor);
                salvarCategoria("Treinamento Funcional", "Força, agilidade, equilíbrio e queima calórica", "zap", 4, setor);
                salvarCategoria("Reabilitação Postural", "Foco em alívio de dores na coluna e postura", "shield", 5, setor);
            }
            case SPA_MASSOTERAPIA -> {
                salvarCategoria("Massagem Relaxante", "Alívio imediato de tensões musculares e estresse", "heart", 1, setor);
                salvarCategoria("Drenagem Linfática", "Redução de inchaço e retenção de líquidos", "sparkles", 2, setor);
                salvarCategoria("Massagem Modeladora", "Movimentos firmes para contorno e circulação", "zap", 3, setor);
                salvarCategoria("Shiatsu & Reflexologia", "Pontos de acupressão e equilíbrio corporal", "sun", 4, setor);
                salvarCategoria("Day Spa & Banhos", "Rituais de imersão, aromaterapia e esfoliação", "moon", 5, setor);
            }
            case ESTUDIO_FOTOGRAFICO -> {
                salvarCategoria("Ensaio Individual / Corporativo", "Retratos profissionais para perfil e posicionamento", "camera", 1, setor);
                salvarCategoria("Ensaio Gestante & Família", "Momentos inesquecíveis da maternidade e família", "heart", 2, setor);
                salvarCategoria("Ensaio Casal / Pré-Wedding", "Sessões românticas em locações especiais", "users", 3, setor);
                salvarCategoria("Infantil & Smash the Cake", "Comemorações de aniversários com cenários lúdicos", "smile", 4, setor);
                salvarCategoria("Eventos & Formaturas", "Cobertura completa em alta resolução", "video", 5, setor);
            }
            default -> { // CLINICA_ESTETICA
                salvarCategoria("Facial", "Rejuvenescimento, hidratação profunda e renovação celular", "sparkles", 1, setor);
                salvarCategoria("Corporal", "Contorno corporal, celulite e gordura localizada", "sparkles", 2, setor);
                salvarCategoria("Massagens & Spa", "Massagens relaxantes e drenagem linfática", "heart", 3, setor);
                salvarCategoria("Depilação a Laser", "Tecnologia de ponta indolor e definitiva", "zap", 4, setor);
                salvarCategoria("Harmonização & Injetáveis", "Toxina botulínica e bioestimuladores", "shield", 5, setor);
            }
        }
    }

    private void salvarCategoria(String nome, String descricao, String icone, int ordem, SetorAtuacao setor) {
        categoriaRepository.save(Categoria.builder()
                .nome(nome)
                .descricao(descricao)
                .icone(icone)
                .ordemExibicao(ordem)
                .ativo(true)
                .setor(setor)
                .build());
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
            throw new com.estetica.exception.RegraNegocioException("Acesso negado: Este procedimento pertence a outro estabelecimento.");
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

