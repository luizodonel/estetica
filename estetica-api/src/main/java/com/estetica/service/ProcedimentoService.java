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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProcedimentoService {

    private final ProcedimentoRepository procedimentoRepository;
    private final CategoriaRepository categoriaRepository;
    private final TenantResolverService tenantResolverService;

    public record ProcedimentoSeed(
            String titulo,
            String descricao,
            int duracaoMinutos,
            BigDecimal preco,
            String imagemUrl
    ) {}

    public record CategoriaSeed(
            String nome,
            String descricao,
            String icone,
            String imagemUrl,
            int ordem,
            int duracaoPadrao,
            BigDecimal precoPadrao,
            List<ProcedimentoSeed> procedimentos
    ) {}

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

        return cats.stream().map(this::toCategoriaDTO).toList();
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

        return cats.stream().map(this::toCategoriaDTO).toList();
    }

    @Transactional
    public CategoriaDTO criarCategoria(SalvarCategoriaRequest req) {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        SetorAtuacao setor = (tenant != null && tenant.getSetor() != null) ? tenant.getSetor() : SetorAtuacao.CLINICA_ESTETICA;

        Categoria c = Categoria.builder()
                .nome(req.nome().trim())
                .descricao(req.descricao() != null ? req.descricao().trim() : null)
                .icone(req.icone() != null && !req.icone().isBlank() ? req.icone().trim() : "🏷️")
                .imagemUrl(req.imagemUrl() != null && !req.imagemUrl().isBlank() ? req.imagemUrl().trim() : null)
                .ordemExibicao(req.ordemExibicao() != null ? req.ordemExibicao() : 1)
                .duracaoMinutosPadrao(req.duracaoMinutosPadrao() != null ? req.duracaoMinutosPadrao() : 45)
                .precoPadrao(req.precoPadrao() != null ? req.precoPadrao() : BigDecimal.ZERO)
                .ativo(req.ativo() != null ? req.ativo() : true)
                .setor(setor)
                .tenant(tenant)
                .build();

        c = categoriaRepository.save(c);
        log.info("[ProcedimentoService] Nova categoria '{}' criada com sucesso para o tenant {}", c.getNome(), tenant != null ? tenant.getId() : "global");
        return toCategoriaDTO(c);
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
        if (req.imagemUrl() != null) {
            c.setImagemUrl(req.imagemUrl().isBlank() ? null : req.imagemUrl().trim());
        }
        if (req.ativo() != null) {
            c.setAtivo(req.ativo());
        }
        if (req.ordemExibicao() != null) {
            c.setOrdemExibicao(req.ordemExibicao());
        }
        if (req.duracaoMinutosPadrao() != null) {
            c.setDuracaoMinutosPadrao(req.duracaoMinutosPadrao());
        }
        if (req.precoPadrao() != null) {
            c.setPrecoPadrao(req.precoPadrao());
        }

        c = categoriaRepository.save(c);
        log.info("[ProcedimentoService] Categoria ID {} atualizada: '{}'", c.getId(), c.getNome());
        return toCategoriaDTO(c);
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
        log.info("[ProcedimentoService] Inicializando catálogo padrão completo (categorias e procedimentos) para o tenant {} no nicho {}", tenant.getId(), setor);
        inicializarCategoriasEProcedimentosPadrao(setor, tenant);
    }

    @Transactional
    public void inicializarCategoriasPadraoPorSetor(SetorAtuacao setor) {
        log.info("[ProcedimentoService] Inicializando catálogo global modelo para o nicho {}", setor);
        inicializarCategoriasEProcedimentosPadrao(setor, null);
    }

    @Transactional
    public void inicializarCategoriasEProcedimentosPadrao(SetorAtuacao setor, ClinicaTenant tenant) {
        List<CategoriaSeed> seeds = getCatalogoPadrao(setor);
        for (CategoriaSeed catSeed : seeds) {
            Categoria cat = Categoria.builder()
                    .nome(catSeed.nome())
                    .descricao(catSeed.descricao())
                    .icone(catSeed.icone())
                    .imagemUrl(catSeed.imagemUrl())
                    .ordemExibicao(catSeed.ordem())
                    .duracaoMinutosPadrao(catSeed.duracaoPadrao())
                    .precoPadrao(catSeed.precoPadrao())
                    .ativo(true)
                    .setor(setor)
                    .tenant(tenant)
                    .build();
            cat = categoriaRepository.save(cat);

            for (ProcedimentoSeed procSeed : catSeed.procedimentos()) {
                procedimentoRepository.save(Procedimento.builder()
                        .categoria(cat)
                        .titulo(procSeed.titulo())
                        .descricao(procSeed.descricao())
                        .duracaoMinutos(procSeed.duracaoMinutos())
                        .preco(procSeed.preco())
                        .imagemUrl(procSeed.imagemUrl() != null && !procSeed.imagemUrl().isBlank()
                                ? procSeed.imagemUrl()
                                : catSeed.imagemUrl())
                        .ativo(true)
                        .tenant(tenant)
                        .build());
            }
        }
    }

    private List<CategoriaSeed> getCatalogoPadrao(SetorAtuacao setor) {
        List<CategoriaSeed> seeds = new ArrayList<>();

        switch (setor) {
            case BARBEARIA -> {
                seeds.add(new CategoriaSeed("Corte de Cabelo", "Degradê, social, navalhado e tesoura", "✂️", "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600", 1, 45, new BigDecimal("50.00"), List.of(
                        new ProcedimentoSeed("Corte Masculino Degradê / Fade", "Degradê na navalha ou máquina com alinhamento e finalização premium", 45, new BigDecimal("50.00"), "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Corte Social Clássico na Tesoura", "Corte tradicional clássico com tesoura e acabamento alinhado", 35, new BigDecimal("45.00"), "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Barba & Barbaterapia", "Alinhamento de barba, toalha quente e terapia", "💈", "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600", 2, 40, new BigDecimal("55.00"), List.of(
                        new ProcedimentoSeed("Barbaterapia com Toalha Quente", "Toalha quente, óleos essenciais nobres, massagem facial e navalha afiada", 40, new BigDecimal("55.00"), "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Alinhamento e Desenho de Barba", "Aparagem rápida e contornos precisos na navalha", 25, new BigDecimal("35.00"), "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Cabelo & Barba", "Combo completo de corte e barba", "✨", "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=600", 3, 75, new BigDecimal("95.00"), List.of(
                        new ProcedimentoSeed("Combo Master: Corte Degradê + Barbaterapia", "Experiência completa com toalha quente, barba esculpida e corte impecável", 75, new BigDecimal("95.00"), "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Química & Pigmentação", "Platinado, luzes, reflexo e selagem", "⚡", "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=600", 4, 60, new BigDecimal("80.00"), List.of(
                        new ProcedimentoSeed("Pigmentação de Barba & Cabelo", "Disfarce natural de fios brancos e realce nítido do contorno", 40, new BigDecimal("60.00"), "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Platinado Global / Nevou", "Descoloração controlada sem agressão e matização ultra branca", 90, new BigDecimal("140.00"), "https://images.unsplash.com/photo-1599351431613-18ef1fdd27e1?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Cuidados & Acabamentos", "Sobrancelha na navalha, depilação de orelha/nariz", "💆", "https://images.unsplash.com/photo-1512290900672-1f55b0a3c20c?auto=format&fit=crop&q=80&w=600", 5, 20, new BigDecimal("30.00"), List.of(
                        new ProcedimentoSeed("Sobrancelha na Navalha & Limpeza de Nariz/Orelha", "Acabamento higiênico e estético rápido para o dia a dia", 20, new BigDecimal("30.00"), "https://images.unsplash.com/photo-1512290900672-1f55b0a3c20c?auto=format&fit=crop&q=80&w=600")
                )));
            }
            case ESTETICA_AUTOMOTIVA -> {
                seeds.add(new CategoriaSeed("Lavagem Simples", "Ducha externa rápida e aspiração básica", "🧼", "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=600", 1, 40, new BigDecimal("60.00"), List.of(
                        new ProcedimentoSeed("Ducha Express & Aspiração Leve", "Lavagem externa com shampoo neutro e aspiração do interior", 40, new BigDecimal("60.00"), "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Lavagem Completa & Detalhada", "Limpeza minuciosa de caixa de roda, motor e chassi", "🚗", "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=600", 2, 90, new BigDecimal("160.00"), List.of(
                        new ProcedimentoSeed("Lavagem Detalhada Completa (Chassi, Rodas e Motor)", "Limpeza técnica minuciosa com pincéis de detalhamento e produtos biodegradáveis", 90, new BigDecimal("160.00"), "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Higienização Interna", "Limpeza profunda de bancos, teto, painel e carpetes", "✨", "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=600", 3, 120, new BigDecimal("290.00"), List.of(
                        new ProcedimentoSeed("Higienização Profunda dos Bancos e Carpetes", "Extração de sujeiras, ácaros e manchas dos tecidos e couros", 120, new BigDecimal("290.00"), "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Higienização com Oxi-Sanitização Anti-Odor", "Desinfecção do ar condicionado e eliminação de fungos/odores com ozônio", 90, new BigDecimal("230.00"), "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Polimento & Cristalização", "Remoção de riscos e restauração do brilho original", "⚡", "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=600", 4, 180, new BigDecimal("450.00"), List.of(
                        new ProcedimentoSeed("Polimento Comercial e Descontaminação", "Eliminação de microrriscos e restauração do brilho da pintura", 180, new BigDecimal("450.00"), "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Polimento Técnico e Cristalização da Pintura", "Correção profunda de verniz e selante protetor de alta durabilidade", 240, new BigDecimal("680.00"), "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Vitrificação & Proteção", "Proteção cerâmica contra intempéries e raios UV", "🛡️", "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600", 5, 300, new BigDecimal("1250.00"), List.of(
                        new ProcedimentoSeed("Vitrificação Cerâmica 9H (Proteção 3 Anos)", "Nanotecnologia que protege contra riscos, chuva ácida e raios UV com efeito hidrofóbico", 300, new BigDecimal("1250.00"), "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Martelinho de Ouro & Reparos", "Remoção de amassados sem danificar a pintura", "🔧", "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600", 6, 60, new BigDecimal("150.00"), List.of(
                        new ProcedimentoSeed("Reparo de Amassados (Martelinho de Ouro por Peça)", "Restauração da lataria original sem necessidade de pintura", 60, new BigDecimal("150.00"), "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600")
                )));
            }
            case SALAO_BELEZA -> {
                seeds.add(new CategoriaSeed("Corte & Penteado", "Cortes femininos, escovas e penteados para festas", "✂️", "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=600", 1, 60, new BigDecimal("120.00"), List.of(
                        new ProcedimentoSeed("Corte Feminino com Lavagem e Escova Modeladora", "Visagismo, lavagem relaxante, corte e finalização com escova", 60, new BigDecimal("120.00"), "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Penteado para Festa e Eventos", "Penteado preso, semi-preso ou tranças estilizadas para ocasiões especiais", 60, new BigDecimal("150.00"), "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Mechas, Coloração & Tintura", "Loiros, morena iluminada, retoque de raiz", "✨", "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=600", 2, 180, new BigDecimal("450.00"), List.of(
                        new ProcedimentoSeed("Mechas Criativas / Morena Iluminada / Loiro Perolado", "Técnicas avançadas de descoloração e tonalização com proteção capilar", 180, new BigDecimal("450.00"), "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Retoque de Raiz & Banho de Brilho", "Uniformização da cor e brilho espelhado nos fios", 90, new BigDecimal("180.00"), "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Tratamentos Capilares", "Cronograma, hidratação profunda e reconstrução", "💆", "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=600", 3, 60, new BigDecimal("160.00"), List.of(
                        new ProcedimentoSeed("Nutrição e Reconstrução com Ozonioterapia", "Recuperação intensiva de fios danificados com reposição de massa", 60, new BigDecimal("160.00"), "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Escova Progressiva Orgânica sem Formol", "Alinhamento térmico duradouro e controle total de frizz", 120, new BigDecimal("280.00"), "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Manicure & Pedicure", "Unhas tradicionais, fibra de vidro e gel", "💅", "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=600", 4, 60, new BigDecimal("75.00"), List.of(
                        new ProcedimentoSeed("Manicure e Pedicure Tradicional Completa", "Cutilagem, esmaltação e hidratação das mãos e pés", 60, new BigDecimal("75.00"), "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Alongamento de Unhas em Gel / Fibra de Vidro", "Unhas longas, resistentes e com acabamento ultra natural", 120, new BigDecimal("190.00"), "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Maquiagem & Visagismo", "Maquiagem profissional para eventos e noivas", "💄", "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600", 5, 60, new BigDecimal("180.00"), List.of(
                        new ProcedimentoSeed("Maquiagem Profissional Social e Eventos", "Pele blindada de longa duração com cílios postiços inclusos", 60, new BigDecimal("180.00"), "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Sobrancelhas & Cílios", "Design, micropigmentação e extensão de cílios", "👁️", "https://images.unsplash.com/photo-1583001809873-a128495da465?auto=format&fit=crop&q=80&w=600", 6, 45, new BigDecimal("80.00"), List.of(
                        new ProcedimentoSeed("Design de Sobrancelhas Personalizado com Henna", "Mapeamento facial e tintura com henna de alta fixação", 40, new BigDecimal("60.00"), "https://images.unsplash.com/photo-1583001809873-a128495da465?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Extensão de Cílios Volume Russo / Híbrido", "Alongamento fio a fio para um olhar marcante e preenchido", 90, new BigDecimal("180.00"), "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600")
                )));
            }
            case RESTAURANTE -> {
                seeds.add(new CategoriaSeed("Salão Principal", "Mesas internas climatizadas e confortáveis", "🍽️", "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600", 1, 90, BigDecimal.ZERO, List.of(
                        new ProcedimentoSeed("Reserva de Mesa Salão Interno Climatizado (até 4 pessoas)", "Mesa reservada com tolerância de 15 minutos para seu almoço ou jantar", 90, BigDecimal.ZERO, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Área Externa & Varanda", "Ambiente agradável e arejado ao ar livre", "🌿", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600", 2, 90, BigDecimal.ZERO, List.of(
                        new ProcedimentoSeed("Reserva de Mesa na Varanda Externa (até 6 pessoas)", "Ambiente arejado e descontraído ao ar livre", 90, BigDecimal.ZERO, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Mesas VIP & Reservadas", "Experiência exclusiva e intimista", "⭐", "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=600", 3, 120, new BigDecimal("150.00"), List.of(
                        new ProcedimentoSeed("Reserva de Lounge VIP com Atendimento Exclusivo", "Espaço reservado e privativo com valor revertido em consumação", 120, new BigDecimal("150.00"), "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Experiência Gastronômica", "Menu degustação especial do chef", "🍷", "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600", 4, 120, new BigDecimal("190.00"), List.of(
                        new ProcedimentoSeed("Menu Degustação do Chef em 5 Etapas (por pessoa)", "Entradas, pratos autorais e sobremesas com harmonização sugerida", 120, new BigDecimal("190.00"), "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Eventos & Comemorações", "Espaço reservado para aniversários e grupos", "🎉", "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600", 5, 180, new BigDecimal("300.00"), List.of(
                        new ProcedimentoSeed("Reserva de Espaço para Aniversário e Grupos", "Área decorada para grupo de 10 a 25 pessoas celebrarem com conforto", 180, new BigDecimal("300.00"), "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600")
                )));
            }
            case DENTISTA -> {
                seeds.add(new CategoriaSeed("Avaliação & Clínico Geral", "Check-up digital, restaurações e diagnóstico", "🦷", "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600", 1, 30, new BigDecimal("150.00"), List.of(
                        new ProcedimentoSeed("Consulta de Avaliação Inicial e Check-up Digital", "Exame intraoral com câmera HD e plano de tratamento completo", 30, new BigDecimal("150.00"), "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Restauração Estética em Resina Composta", "Reconstrução dentária anatômica imperceptível", 45, new BigDecimal("180.00"), "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Limpeza & Profilaxia", "Remoção de tártaro e aplicação de flúor", "✨", "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600", 2, 45, new BigDecimal("200.00"), List.of(
                        new ProcedimentoSeed("Profilaxia Completa com Remoção de Tártaro e Jato de Bicarbonato", "Ultrassom odontológico, polimento coronário e flúor protetor", 45, new BigDecimal("200.00"), "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Clareamento Dental", "Clareamento a laser e caseiro supervisionado", "☀️", "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=600", 3, 60, new BigDecimal("450.00"), List.of(
                        new ProcedimentoSeed("Sessão de Clareamento a Laser em Consultório", "Dentes visivelmente mais brancos em sessão única monitorada", 60, new BigDecimal("450.00"), "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Ortodontia & Alinhadores", "Aparelhos estéticos e alinhadores invisíveis", "😁", "https://images.unsplash.com/photo-1593054980934-e1526462611f?auto=format&fit=crop&q=80&w=600", 4, 30, new BigDecimal("140.00"), List.of(
                        new ProcedimentoSeed("Manutenção Mensal de Aparelho Ortodôntico", "Troca de arcos, elásticos e conferência de alinhamento", 30, new BigDecimal("140.00"), "https://images.unsplash.com/photo-1593054980934-e1526462611f?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Implantes & Próteses", "Reabilitação oral e coroas definitivas", "🛡️", "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600", 5, 45, new BigDecimal("220.00"), List.of(
                        new ProcedimentoSeed("Consulta de Planejamento de Implante e Prótese Dentária", "Avaliação tomográfica e diagnóstico para reabilitação oral", 45, new BigDecimal("220.00"), "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600")
                )));
            }
            case MEDICA -> {
                seeds.add(new CategoriaSeed("Consulta Médica Geral", "Atendimento clínico e check-up de rotina", "🩺", "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600", 1, 30, new BigDecimal("200.00"), List.of(
                        new ProcedimentoSeed("Consulta Clínica Geral e Check-up de Rotina", "Avaliação clínica integral, histórico de saúde e pedidos de exames", 30, new BigDecimal("200.00"), "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Consulta Especializada", "Avaliação com especialista médico", "⚕️", "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=600", 2, 40, new BigDecimal("300.00"), List.of(
                        new ProcedimentoSeed("Consulta Médica Especializada", "Atendimento focado com médico especialista na área", 40, new BigDecimal("300.00"), "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Retorno & Acompanhamento", "Reavaliação pós-tratamento e exames", "📅", "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600", 3, 20, new BigDecimal("100.00"), List.of(
                        new ProcedimentoSeed("Consulta de Retorno e Avaliação de Exames", "Conferência de exames laboratoriais e ajuste terapêutico", 20, new BigDecimal("100.00"), "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Exames Clínicos", "Exames laboratoriais e diagnósticos rápidos", "📋", "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600", 4, 20, new BigDecimal("90.00"), List.of(
                        new ProcedimentoSeed("Eletrocardiograma (ECG) com Laudo Médico", "Exame rápido e seguro com emissão imediata de laudo cardiológico", 20, new BigDecimal("90.00"), "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Procedimentos Ambulatoriais", "Pequenas cirurgias e suturas", "🛡️", "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=600", 5, 30, new BigDecimal("150.00"), List.of(
                        new ProcedimentoSeed("Lavagem e Remoção de Cerume Otológico", "Procedimento higiênico e indolor para desobstrução do conduto auditivo", 30, new BigDecimal("150.00"), "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=600")
                )));
            }
            case TATUAGEM -> {
                seeds.add(new CategoriaSeed("Tatuagem Pequena / Fine Line", "Traços finos, escritas e artes delicadas", "🖋️", "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&q=80&w=600", 1, 60, new BigDecimal("220.00"), List.of(
                        new ProcedimentoSeed("Tatuagem Delicada / Escrita / Fine Line (até 7cm)", "Traços finos e precisos com materiais 100% descartáveis", 60, new BigDecimal("220.00"), "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Tatuagem Média / Autoral", "Projetos exclusivos sombreados ou coloridos", "🎨", "https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&q=80&w=600", 2, 120, new BigDecimal("450.00"), List.of(
                        new ProcedimentoSeed("Tatuagem Média Autoral (até 15cm) Preto e Cinza", "Arte exclusiva com sombreamento e técnicas avançadas de textura", 120, new BigDecimal("450.00"), "https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Fechamento (Sessão)", "Grandes projetos cobrados por sessão", "⏱️", "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&q=80&w=600", 3, 240, new BigDecimal("850.00"), List.of(
                        new ProcedimentoSeed("Sessão de Fechamento de Braço / Costas (4 Horas)", "Sessão contínua para grandes composições personalizadas", 240, new BigDecimal("850.00"), "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Body Piercing & Joias", "Perfurações com joias de titânio assépticas", "💎", "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&q=80&w=600", 4, 30, new BigDecimal("95.00"), List.of(
                        new ProcedimentoSeed("Perfuração de Piercing em Titânio com Joia Básica", "Perfuração asséptica com agulha americana e joia hipoalergênica", 30, new BigDecimal("95.00"), "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Cobertura (Cover-up)", "Revitalização e cobertura de tatuagens antigas", "🔄", "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&q=80&w=600", 5, 40, new BigDecimal("150.00"), List.of(
                        new ProcedimentoSeed("Avaliação e Planejamento para Cobertura de Tatuagem", "Estudo de viabilidade artística e criação de novo projeto", 40, new BigDecimal("150.00"), "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&q=80&w=600")
                )));
            }
            case PSICOLOGIA -> {
                seeds.add(new CategoriaSeed("Psicoterapia Individual", "Sessões para autoconhecimento e saúde mental", "🧠", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600", 1, 50, new BigDecimal("180.00"), List.of(
                        new ProcedimentoSeed("Sessão de Psicoterapia Individual Adulto", "Espaço acolhedor e sigiloso para autoconhecimento e saúde emocional", 50, new BigDecimal("180.00"), "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Terapia de Casal & Família", "Diálogo, mediação de conflitos e convivência", "👥", "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?auto=format&fit=crop&q=80&w=600", 2, 60, new BigDecimal("260.00"), List.of(
                        new ProcedimentoSeed("Sessão de Terapia de Casal e Mediação Familiar", "Comunicação assertiva, resolução de impasses e reconexão afetiva", 60, new BigDecimal("260.00"), "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Terapia Infantil", "Ludoterapia e orientação emocional infantil", "🧸", "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=600", 3, 50, new BigDecimal("190.00"), List.of(
                        new ProcedimentoSeed("Sessão de Ludoterapia e Acompanhamento Infantil", "Abordagem com brincadeiras terapêuticas para expressão emocional da criança", 50, new BigDecimal("190.00"), "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Orientação Vocacional", "Direcionamento profissional e de carreira", "🧭", "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600", 4, 50, new BigDecimal("160.00"), List.of(
                        new ProcedimentoSeed("Sessão de Orientação Profissional e de Carreira", "Mapeamento de habilidades, interesses e planejamento de futuro", 50, new BigDecimal("160.00"), "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Avaliação Psicológica", "Laudos e avaliações psicológicas detalhadas", "📄", "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600", 5, 60, new BigDecimal("320.00"), List.of(
                        new ProcedimentoSeed("Sessão de Aplicação de Testes e Avaliação Psicológica", "Investigação diagnóstica com instrumentos validados pelo CFP", 60, new BigDecimal("320.00"), "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600")
                )));
            }
            case NUTRICAO -> {
                seeds.add(new CategoriaSeed("Primeira Consulta & Anamnese", "Avaliação clínica inicial e histórico alimentar", "🥗", "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=600", 1, 60, new BigDecimal("230.00"), List.of(
                        new ProcedimentoSeed("Consulta Nutricional Inicial Completa com Dieta Sob Medida", "Histórico clínico, hábitos, metas e entrega de cardápio personalizado", 60, new BigDecimal("230.00"), "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Bioimpedância & Antropometria", "Composição corporal, percentual de gordura e músculo", "📊", "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600", 2, 30, new BigDecimal("120.00"), List.of(
                        new ProcedimentoSeed("Exame de Bioimpedância Tetrapolar e Medidas Corporais", "Avaliação da massa magra, gordura corporal e taxa metabólica basal", 30, new BigDecimal("120.00"), "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Reeducação Alimentar", "Plano personalizado para emagrecimento sustentável", "❤️", "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600", 3, 45, new BigDecimal("160.00"), List.of(
                        new ProcedimentoSeed("Acompanhamento de Reeducação Alimentar e Emagrecimento Saudável", "Estratégias práticas para mudar hábitos sem dietas restritivas", 45, new BigDecimal("160.00"), "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Nutrição Esportiva", "Foco em hipertrofia e rendimento atlético", "⚡", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600", 4, 60, new BigDecimal("260.00"), List.of(
                        new ProcedimentoSeed("Consulta de Nutrição Esportiva para Performance e Hipertrofia", "Periodização de carboidratos, suplementação pré/pós treino e rendimento", 60, new BigDecimal("260.00"), "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Consulta de Retorno", "Acompanhamento periódico e ajustes de plano", "📅", "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=600", 5, 35, new BigDecimal("130.00"), List.of(
                        new ProcedimentoSeed("Consulta de Retorno e Ajuste do Cardápio Nutricional", "Conferência de evolução, pesagem comparativa e refinamento do plano", 35, new BigDecimal("130.00"), "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=600")
                )));
            }
            case PILATES_PERSONAL -> {
                seeds.add(new CategoriaSeed("Aula Experimental", "Avaliação física e primeiros contatos com os aparelhos", "⭐", "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600", 1, 50, new BigDecimal("60.00"), List.of(
                        new ProcedimentoSeed("Aula Experimental de Pilates nos Aparelhos (Reformer e Cadillac)", "Primeira vivência prática nos equipamentos com acompanhamento exclusivo", 50, new BigDecimal("60.00"), "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Pilates em Aparelhos", "Reformer, Cadillac, Chair e Barrel em pequenos grupos", "🧘", "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600", 2, 50, new BigDecimal("95.00"), List.of(
                        new ProcedimentoSeed("Sessão de Pilates em Aparelhos com Fisioterapeuta", "Fortalecimento do core, flexibilidade e alívio de tensões articulares", 50, new BigDecimal("95.00"), "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Personal Trainer Individual", "Treinamento sob medida com acompanhamento 1 a 1", "🏋️", "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600", 3, 60, new BigDecimal("120.00"), List.of(
                        new ProcedimentoSeed("Sessão de Treino com Personal Trainer VIP (1 para 1)", "Treinamento resistido e musculação focada nos seus objetivos", 60, new BigDecimal("120.00"), "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Treinamento Funcional", "Força, agilidade, equilíbrio e queima calórica", "⚡", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600", 4, 50, new BigDecimal("80.00"), List.of(
                        new ProcedimentoSeed("Treino Funcional de Alta Intensidade e Condicionamento", "Movimentos dinâmicos, queima calórica e condicionamento cardiovascular", 50, new BigDecimal("80.00"), "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Reabilitação Postural", "Foco em alívio de dores na coluna e postura", "🛡️", "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=600", 5, 50, new BigDecimal("130.00"), List.of(
                        new ProcedimentoSeed("Sessão de RPG / Reeducação Postural Global para Dores na Coluna", "Tratamento de hérnias, escolioses e correção da postura", 50, new BigDecimal("130.00"), "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=600")
                )));
            }
            case SPA_MASSOTERAPIA -> {
                seeds.add(new CategoriaSeed("Massagem Relaxante", "Alívio imediato de tensões musculares e estresse", "💆", "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600", 1, 50, new BigDecimal("150.00"), List.of(
                        new ProcedimentoSeed("Massagem Relaxante com Óleos Essenciais e Aromaterapia", "Toques suaves e envolventes para eliminar tensões e ansiedade", 50, new BigDecimal("150.00"), "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Massagem com Velas Quentes (Candle Massage)", "Óleo vegetal aquecido que hidrata a pele e proporciona relaxamento profundo", 60, new BigDecimal("190.00"), "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Drenagem Linfática", "Redução de inchaço e retenção de líquidos", "✨", "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=600", 2, 50, new BigDecimal("160.00"), List.of(
                        new ProcedimentoSeed("Drenagem Linfática Corporal Manual Anti-Inchaço", "Manobras ritmadas para circulação e eliminação de toxinas", 50, new BigDecimal("160.00"), "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Massagem Modeladora", "Movimentos firmes para contorno e circulação", "⚡", "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=600", 3, 50, new BigDecimal("160.00"), List.of(
                        new ProcedimentoSeed("Massagem Modeladora Turbinada Redutora de Medidas", "Movimentos vigorosos para ativação celular e contorno corporal", 50, new BigDecimal("160.00"), "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Shiatsu & Reflexologia", "Pontos de acupressão e equilíbrio corporal", "☀️", "https://images.unsplash.com/photo-1512290900672-1f55b0a3c20c?auto=format&fit=crop&q=80&w=600", 4, 45, new BigDecimal("140.00"), List.of(
                        new ProcedimentoSeed("Sessão de Reflexologia Podal e Shiatsu Terapêutico", "Pressão em pontos reflexos dos pés para equilíbrio bioenergético", 45, new BigDecimal("140.00"), "https://images.unsplash.com/photo-1512290900672-1f55b0a3c20c?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Day Spa & Banhos", "Rituais de imersão, aromaterapia e esfoliação", "🛁", "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600", 5, 120, new BigDecimal("380.00"), List.of(
                        new ProcedimentoSeed("Day Spa Revitalizante: Banho de Imersão + Esfoliação + Massagem", "Experiência de bem-estar completa para renovação física e mental", 120, new BigDecimal("380.00"), "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600")
                )));
            }
            case ESTUDIO_FOTOGRAFICO -> {
                seeds.add(new CategoriaSeed("Ensaio Individual / Corporativo", "Retratos profissionais para perfil e posicionamento", "📸", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600", 1, 60, new BigDecimal("320.00"), List.of(
                        new ProcedimentoSeed("Ensaio de Retratos Corporativos para LinkedIn e Posicionamento", "10 fotos em alta resolução tratadas com iluminação de estúdio", 60, new BigDecimal("320.00"), "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Ensaio Gestante & Família", "Momentos inesquecíveis da maternidade e família", "❤️", "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600", 2, 90, new BigDecimal("550.00"), List.of(
                        new ProcedimentoSeed("Ensaio de Gestante em Estúdio com Figurino e Trocas de Look", "20 fotos editadas, figurinos exclusivos e produção inclusa", 90, new BigDecimal("550.00"), "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Ensaio Casal / Pré-Wedding", "Sessões românticas em locações especiais", "💍", "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600", 3, 90, new BigDecimal("580.00"), List.of(
                        new ProcedimentoSeed("Ensaio Externo Pré-Wedding ao Pôr do Sol (20 Fotos Editadas)", "Locação externa, direção espontânea e fotos românticas em alta definição", 90, new BigDecimal("580.00"), "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Infantil & Smash the Cake", "Comemorações de aniversários com cenários lúdicos", "🎂", "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600", 4, 60, new BigDecimal("390.00"), List.of(
                        new ProcedimentoSeed("Ensaio Infantil Smash the Cake com Cenário Temático Incluso", "Cenário lúdico, bolo para o ensaio e fotos divertidas da celebração", 60, new BigDecimal("390.00"), "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Eventos & Formaturas", "Cobertura completa em alta resolução", "🎥", "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=600", 5, 120, new BigDecimal("690.00"), List.of(
                        new ProcedimentoSeed("Cobertura Fotográfica de Mini Evento / Batizado (2 Horas)", "Registro fotojornalístico completo de todos os convidados e momentos", 120, new BigDecimal("690.00"), "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=600")
                )));
            }
            default -> { // CLINICA_ESTETICA
                seeds.add(new CategoriaSeed("Facial", "Rejuvenescimento, hidratação profunda e renovação celular", "✨", "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600", 1, 60, new BigDecimal("180.00"), List.of(
                        new ProcedimentoSeed("Limpeza de Pele Profunda com Fototerapia", "Higienização minuciosa, extração sem dor e máscara de LED regeneradora", 60, new BigDecimal("180.00"), "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600"),
                        new ProcedimentoSeed("Peeling Químico Renovador de Colágeno", "Atenuação de manchas solares, melasma e renovação da textura cutânea", 45, new BigDecimal("250.00"), "https://images.unsplash.com/photo-1512290900672-1f55b0a3c20c?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Corporal", "Contorno corporal, celulite e gordura localizada", "💎", "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=600", 2, 60, new BigDecimal("320.00"), List.of(
                        new ProcedimentoSeed("Criomodelagem e Drenagem Escultural", "Resfriamento controlado de adipócitos e manobras drenantes ativadoras", 60, new BigDecimal("320.00"), "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Massagens & Spa", "Massagens relaxantes e drenagem linfática", "💆", "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600", 3, 50, new BigDecimal("160.00"), List.of(
                        new ProcedimentoSeed("Massagem Relaxante com Pedras Quentes e Aromaterapia", "Sessão revigorante com pedras vulcânicas e óleos nobres", 50, new BigDecimal("160.00"), "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Depilação a Laser", "Tecnologia de ponta indolor e definitiva", "⚡", "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=600", 4, 30, new BigDecimal("190.00"), List.of(
                        new ProcedimentoSeed("Depilação a Laser - Sessão Axilas & Pernas", "Remoção definitiva e suave com tecnologia de ponteira resfriada", 30, new BigDecimal("190.00"), "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=600")
                )));
                seeds.add(new CategoriaSeed("Harmonização & Injetáveis", "Toxina botulínica e bioestimuladores", "💉", "https://images.unsplash.com/photo-1512290900672-1f55b0a3c20c?auto=format&fit=crop&q=80&w=600", 5, 45, new BigDecimal("890.00"), List.of(
                        new ProcedimentoSeed("Aplicação de Toxina Botulínica Preventiva / Corretiva", "Atenuação de linhas de expressão na testa, glabela e olhos", 45, new BigDecimal("890.00"), "https://images.unsplash.com/photo-1512290900672-1f55b0a3c20c?auto=format&fit=crop&q=80&w=600")
                )));
            }
        }

        return seeds;
    }

    @Transactional
    public List<ProcedimentoDTO> listarProcedimentos(Long categoriaId) {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        Long tenantId = tenant != null ? tenant.getId() : null;

        List<Procedimento> list;
        if (tenantId != null) {
            if (procedimentoRepository.countByTenantId(tenantId) == 0) {
                inicializarCategoriasPadraoParaTenant(tenant, tenant.getSetor() != null ? tenant.getSetor() : SetorAtuacao.CLINICA_ESTETICA);
            }
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

    @Transactional
    public List<ProcedimentoDTO> listarTodosAdmin() {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        List<Procedimento> list;
        if (tenant != null) {
            if (procedimentoRepository.countByTenantId(tenant.getId()) == 0) {
                inicializarCategoriasPadraoParaTenant(tenant, tenant.getSetor() != null ? tenant.getSetor() : SetorAtuacao.CLINICA_ESTETICA);
            }
            list = procedimentoRepository.findByTenantIdOrderByTituloAsc(tenant.getId());
        } else {
            list = procedimentoRepository.findAll();
        }

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

    private CategoriaDTO toCategoriaDTO(Categoria c) {
        return new CategoriaDTO(
                c.getId(),
                c.getNome(),
                c.getDescricao(),
                c.getIcone(),
                c.getImagemUrl(),
                c.getAtivo(),
                c.getOrdemExibicao(),
                c.getDuracaoMinutosPadrao(),
                c.getPrecoPadrao()
        );
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
