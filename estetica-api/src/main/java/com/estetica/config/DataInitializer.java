package com.estetica.config;

import com.estetica.model.Categoria;
import com.estetica.model.Procedimento;
import com.estetica.repository.CategoriaRepository;
import com.estetica.repository.ProcedimentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoriaRepository categoriaRepository;
    private final ProcedimentoRepository procedimentoRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            // Garante tamanho de colunas de telefone para até 50 caracteres e novas colunas antifraude
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_usuario ALTER COLUMN telefone_whatsapp TYPE VARCHAR(50)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_clinica_tenant ALTER COLUMN telefone_whatsapp TYPE VARCHAR(50)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_lojista ALTER COLUMN telefone_whatsapp TYPE VARCHAR(50)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_lojista ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(30)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_lojista ADD COLUMN IF NOT EXISTS ip_cadastro VARCHAR(80)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_lojista ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(150)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_clinica_tenant ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(30)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_clinica_tenant ADD COLUMN IF NOT EXISTS ip_cadastro VARCHAR(80)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_clinica_tenant ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(150)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_clinica_tenant ADD COLUMN IF NOT EXISTS horario_funcionamento VARCHAR(150)");
            jdbcTemplate.execute("UPDATE tb_clinica_tenant SET horario_funcionamento = '09:00 às 19:00' WHERE horario_funcionamento IS NULL OR horario_funcionamento = ''");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_agendamento ADD COLUMN IF NOT EXISTS token_confirmacao VARCHAR(64)");
            jdbcTemplate.execute("UPDATE tb_agendamento SET token_confirmacao = md5(random()::text || clock_timestamp()::text || id::text) WHERE token_confirmacao IS NULL");

            // Índices únicos case-insensitive para garantir que nenhum link/slug seja duplicado
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_clinica_tenant_slug_lower ON tb_clinica_tenant (LOWER(slug))");
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_lojista_slug_lower ON tb_lojista (LOWER(slug))");
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_clinica_tenant_link_lower ON tb_clinica_tenant (LOWER(link_personalizado)) WHERE link_personalizado IS NOT NULL");
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_lojista_link_lower ON tb_lojista (LOWER(link_personalizado)) WHERE link_personalizado IS NOT NULL");

            // Remove bloqueio automático padrão de almoço (12:00 às 13:00) que impedia agendamentos entre 11:30 e 13:00
            jdbcTemplate.execute("UPDATE tb_horario_trabalho SET inicio_intervalo = NULL, fim_intervalo = NULL WHERE inicio_intervalo = '12:00:00' AND fim_intervalo = '13:00:00'");
            jdbcTemplate.execute("UPDATE tb_usuario SET primeiro_acesso = false WHERE role = 'ROLE_PROFISSIONAL' AND primeiro_acesso = true");
            org.springframework.security.crypto.password.PasswordEncoder encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
            String hash123456 = encoder.encode("123456");
            jdbcTemplate.update("UPDATE tb_usuario SET senha_hash = ? WHERE role = 'ROLE_PROFISSIONAL' AND (senha_hash IS NULL OR senha_hash = '' OR senha_hash = 'SEM_LOGIN')", hash123456);

            // Remove restrições únicas globais legadas em tb_usuario (email, login e telefone de clientes podem repetir para familiares)
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_usuario DROP CONSTRAINT IF EXISTS uk_spmnyb4dsul95fjmr5kmdmvub");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_usuario DROP CONSTRAINT IF EXISTS uk_1vofibjsgo77e7km8wowva1qe");
            jdbcTemplate.execute(
                "DO $$ " +
                "DECLARE r RECORD; " +
                "BEGIN " +
                "  FOR r IN ( " +
                "    SELECT conname FROM pg_constraint con " +
                "    INNER JOIN pg_class rel ON rel.oid = con.conrelid " +
                "    WHERE rel.relname = 'tb_usuario' AND con.contype = 'u' " +
                "  ) LOOP " +
                "    EXECUTE 'ALTER TABLE tb_usuario DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname); " +
                "  END LOOP; " +
                "END $$;"
            );
            jdbcTemplate.execute("UPDATE tb_usuario SET email = NULL WHERE email LIKE '%@cliente.local' OR email LIKE '%@especialista.local'");

            // Atualiza eventual nome legado "L'Élégance" ou "Agendar." no tenant master para "Agendoou" e define a logo oficial /logo-agendoou.png
            jdbcTemplate.execute("UPDATE tb_clinica_tenant SET nome_empresa = 'Agendoou' WHERE nome_empresa ILIKE '%Élégance%' OR nome_empresa ILIKE '%Elegance%' OR nome_empresa ILIKE 'Agendar.%'");
            jdbcTemplate.execute("UPDATE tb_lojista SET nome_empresa = 'Agendoou' WHERE nome_empresa ILIKE '%Élégance%' OR nome_empresa ILIKE '%Elegance%' OR nome_empresa ILIKE 'Agendar.%'");
            jdbcTemplate.execute("UPDATE tb_clinica_tenant SET slug = 'agendoou', link_personalizado = 'https://agendoou.logistadigital.com.br/' WHERE slug = 'estetica' AND NOT EXISTS (SELECT 1 FROM tb_clinica_tenant WHERE slug = 'agendoou')");
            jdbcTemplate.execute("UPDATE tb_lojista SET slug = 'agendoou', link_personalizado = 'https://agendoou.logistadigital.com.br/', link_login = 'https://agendoou.logistadigital.com.br/login' WHERE slug = 'estetica' AND NOT EXISTS (SELECT 1 FROM tb_lojista WHERE slug = 'agendoou')");
            jdbcTemplate.execute("UPDATE tb_clinica_tenant SET logo_url = '/logo-agendoou.png', banner_subtitulo = 'Agendou, vendeu, lucrou. Sua empresa no piloto automático.' WHERE slug IN ('agendoou', 'estetica')");
            jdbcTemplate.execute("UPDATE tb_lojista SET logo_url = '/logo-agendoou.png' WHERE slug IN ('agendoou', 'estetica')");

            // Remove restrições de unicidade legadas na tabela tb_categoria para permitir
            // que cada tenant e nicho tenha suas próprias categorias sem colisão de nomes.
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_categoria DROP CONSTRAINT IF EXISTS uk_at5cf41guxjf4dkdeo5qxva9");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS tb_categoria DROP CONSTRAINT IF EXISTS categorias_nome_key");
            jdbcTemplate.execute("DROP INDEX IF EXISTS uk_at5cf41guxjf4dkdeo5qxva9 CASCADE");
            jdbcTemplate.execute(
                "DO $$ " +
                "DECLARE r RECORD; " +
                "BEGIN " +
                "  FOR r IN ( " +
                "    SELECT conname FROM pg_constraint con " +
                "    INNER JOIN pg_class rel ON rel.oid = con.conrelid " +
                "    WHERE rel.relname = 'tb_categoria' AND con.contype = 'u' " +
                "  ) LOOP " +
                "    EXECUTE 'ALTER TABLE tb_categoria DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname); " +
                "  END LOOP; " +
                "  FOR r IN ( " +
                "    SELECT indexname FROM pg_indexes " +
                "    WHERE tablename = 'tb_categoria' AND indexname LIKE '%uk_%' " +
                "  ) LOOP " +
                "    EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname) || ' CASCADE'; " +
                "  END LOOP; " +
                "END $$;"
            );
            log.info("Restrições únicas legadas de 'tb_categoria' verificadas e ajustadas.");
        } catch (Exception e) {
            log.warn("Nota na verificação de constraints de tb_categoria: {}", e.getMessage());
        }

        // Atualiza categorias antigas que eventualmente estejam com setor nulo ou tempo/preço padrão vazios
        List<Categoria> antigas = categoriaRepository.findAll();
        for (Categoria c : antigas) {
            boolean mudou = false;
            if (c.getSetor() == null) {
                c.setSetor(com.estetica.model.SetorAtuacao.CLINICA_ESTETICA);
                mudou = true;
            }
            if (c.getDuracaoMinutosPadrao() == null) {
                c.setDuracaoMinutosPadrao(45);
                mudou = true;
            }
            if (c.getPrecoPadrao() == null) {
                c.setPrecoPadrao(new java.math.BigDecimal("50.00"));
                mudou = true;
            }
            if (c.getImagemUrl() == null || c.getImagemUrl().isBlank()) {
                c.setImagemUrl("https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=600");
                mudou = true;
            }
            if (mudou) {
                categoriaRepository.save(c);
            }
        }

        if (categoriaRepository.count() > 0) {
            log.info("Base de dados já possui categorias e procedimentos cadastrados.");
            return;
        }

        log.info("Inicializando catálogo base de procedimentos e categorias...");

        // 1. Categorias Oficiais de Estética
        Categoria catFacial = categoriaRepository.save(Categoria.builder()
                .nome("Facial")
                .descricao("Rejuvenescimento, hidratação profunda, limpeza e renovação celular")
                .icone("sparkles")
                .ordemExibicao(1)
                .ativo(true)
                .setor(com.estetica.model.SetorAtuacao.CLINICA_ESTETICA)
                .build());

        Categoria catCorporal = categoriaRepository.save(Categoria.builder()
                .nome("Corporal")
                .descricao("Contorno corporal, tratamento de celulite, gordura localizada e flacidez")
                .icone("sparkles")
                .ordemExibicao(2)
                .ativo(true)
                .setor(com.estetica.model.SetorAtuacao.CLINICA_ESTETICA)
                .build());

        Categoria catMassagens = categoriaRepository.save(Categoria.builder()
                .nome("Massagens & Spa")
                .descricao("Massagens relaxantes, drenagem linfática e alívio do estresse diário")
                .icone("heart")
                .ordemExibicao(3)
                .ativo(true)
                .setor(com.estetica.model.SetorAtuacao.CLINICA_ESTETICA)
                .build());

        Categoria catLaser = categoriaRepository.save(Categoria.builder()
                .nome("Depilação a Laser")
                .descricao("Tecnologia de ponta indolor e definitiva com laser de diodo de última geração")
                .icone("zap")
                .ordemExibicao(4)
                .ativo(true)
                .setor(com.estetica.model.SetorAtuacao.CLINICA_ESTETICA)
                .build());

        // 2. Procedimentos Base
        procedimentoRepository.save(Procedimento.builder()
                .categoria(catFacial)
                .titulo("Limpeza de Pele Profunda com Fototerapia")
                .descricao("Higienização minuciosa, extração de cravos sem dor, esfoliação ultrassônica e máscara de LED regeneradora.")
                .duracaoMinutos(60)
                .preco(new BigDecimal("180.00"))
                .imagemUrl("https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600")
                .ativo(true)
                .build());

        procedimentoRepository.save(Procedimento.builder()
                .categoria(catFacial)
                .titulo("Peeling Químico Renovador de Colágeno")
                .descricao("Aplicação de ácidos selecionados para atenuação de manchas solares, melasma e renovação da textura cutânea.")
                .duracaoMinutos(45)
                .preco(new BigDecimal("250.00"))
                .imagemUrl("https://images.unsplash.com/photo-1512290900672-1f55b0a3c20c?auto=format&fit=crop&q=80&w=600")
                .ativo(true)
                .build());

        procedimentoRepository.save(Procedimento.builder()
                .categoria(catCorporal)
                .titulo("Criomodelagem e Drenagem Escultural")
                .descricao("Combinação de resfriamento controlado para quebra de adipócitos com manobras drenantes ativadoras da circulação.")
                .duracaoMinutos(60)
                .preco(new BigDecimal("320.00"))
                .imagemUrl("https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=600")
                .ativo(true)
                .build());

        procedimentoRepository.save(Procedimento.builder()
                .categoria(catMassagens)
                .titulo("Massagem Relaxante com Pedras Quentes e Aromaterapia")
                .descricao("Sessão revigorante com óleos essenciais nobres, pedras vulcânicas aquecidas e alívio das tensões acumuladas.")
                .duracaoMinutos(50)
                .preco(new BigDecimal("160.00"))
                .imagemUrl("https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600")
                .ativo(true)
                .build());

        procedimentoRepository.save(Procedimento.builder()
                .categoria(catLaser)
                .titulo("Depilação a Laser - Sessão Axilas & Pernas")
                .descricao("Remoção definitiva e suave com tecnologia de resfriamento na ponteira que garante conforto total.")
                .duracaoMinutos(30)
                .preco(new BigDecimal("190.00"))
                .imagemUrl("https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=600")
                .ativo(true)
                .build());

        log.info("Catálogo base inicializado com sucesso! (Nenhum usuário ou credencial inserido automaticamente)");
    }
}
