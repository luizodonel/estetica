package com.estetica.repository;

import com.estetica.model.Categoria;
import com.estetica.model.SetorAtuacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findByAtivoTrueOrderByOrdemExibicaoAsc();
    List<Categoria> findBySetorAndAtivoTrueOrderByOrdemExibicaoAsc(SetorAtuacao setor);
    List<Categoria> findBySetor(SetorAtuacao setor);

    List<Categoria> findByTenantIdAndAtivoTrueOrderByOrdemExibicaoAsc(Long tenantId);
    List<Categoria> findByTenantIdOrderByOrdemExibicaoAsc(Long tenantId);

    @Modifying
    @Query("DELETE FROM Categoria c WHERE c.tenant.id = :tenantId")
    void deleteByTenantId(@Param("tenantId") Long tenantId);
}

