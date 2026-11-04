package com.estetica.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataCleanupRunner implements ApplicationRunner {

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            log.info("[DataCleanupRunner] Executando deduplicação e limpeza de categorias e procedimentos duplicados...");

            // 1. Reatribuir procedimentos de categorias duplicadas para a categoria com menor ID (mesmo nome e mesmo tenant)
            em.createNativeQuery("""
                UPDATE tb_procedimento p
                SET categoria_id = c_keep.id
                FROM tb_categoria c_dup
                JOIN tb_categoria c_keep 
                  ON LOWER(TRIM(c_keep.nome)) = LOWER(TRIM(c_dup.nome)) 
                 AND COALESCE(c_keep.tenant_id, 0) = COALESCE(c_dup.tenant_id, 0)
                 AND c_keep.id < c_dup.id
                WHERE p.categoria_id = c_dup.id
            """).executeUpdate();

            // 2. Deletar categorias duplicadas que agora não possuem mais procedimentos vinculados
            int deletedCats = em.createNativeQuery("""
                DELETE FROM tb_categoria c_dup
                WHERE EXISTS (
                    SELECT 1 FROM tb_categoria c_keep
                    WHERE LOWER(TRIM(c_keep.nome)) = LOWER(TRIM(c_dup.nome))
                      AND COALESCE(c_keep.tenant_id, 0) = COALESCE(c_dup.tenant_id, 0)
                      AND c_keep.id < c_dup.id
                )
            """).executeUpdate();

            if (deletedCats > 0) {
                log.info("[DataCleanupRunner] {} categorias duplicadas foram removidas com sucesso.", deletedCats);
            }

            // 3. Remover duplicatas da tabela de junção tb_profissional_procedimento antes de deletar procedimentos duplicados
            em.createNativeQuery("""
                DELETE FROM tb_profissional_procedimento pp
                WHERE pp.procedimento_id IN (
                    SELECT p_dup.id FROM tb_procedimento p_dup
                    WHERE EXISTS (
                        SELECT 1 FROM tb_procedimento p_keep
                        WHERE LOWER(TRIM(p_keep.titulo)) = LOWER(TRIM(p_dup.titulo))
                          AND p_keep.categoria_id = p_dup.categoria_id
                          AND COALESCE(p_keep.tenant_id, 0) = COALESCE(p_dup.tenant_id, 0)
                          AND p_keep.id < p_dup.id
                    )
                )
            """).executeUpdate();

            // 4. Deletar procedimentos duplicados
            int deletedProcs = em.createNativeQuery("""
                DELETE FROM tb_procedimento p_dup
                WHERE EXISTS (
                    SELECT 1 FROM tb_procedimento p_keep
                    WHERE LOWER(TRIM(p_keep.titulo)) = LOWER(TRIM(p_dup.titulo))
                      AND p_keep.categoria_id = p_dup.categoria_id
                      AND COALESCE(p_keep.tenant_id, 0) = COALESCE(p_dup.tenant_id, 0)
                      AND p_keep.id < p_dup.id
                )
                AND NOT EXISTS (
                    SELECT 1 FROM tb_agendamento a WHERE a.procedimento_id = p_dup.id
                )
            """).executeUpdate();

            if (deletedProcs > 0) {
                log.info("[DataCleanupRunner] {} procedimentos duplicados foram removidos com sucesso.", deletedProcs);
            }

            em.flush();
            log.info("[DataCleanupRunner] Deduplicação concluída com sucesso.");
        } catch (Exception e) {
            log.warn("[DataCleanupRunner] Aviso ao executar limpeza inicial: {}", e.getMessage());
        }
    }
}

