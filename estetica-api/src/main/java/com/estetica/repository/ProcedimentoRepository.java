package com.estetica.repository;

import com.estetica.model.Procedimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcedimentoRepository extends JpaRepository<Procedimento, Long> {
    List<Procedimento> findByAtivoTrueOrderByTituloAsc();
    List<Procedimento> findByCategoriaIdAndAtivoTrueOrderByTituloAsc(Long categoriaId);

    List<Procedimento> findByTenantIdAndAtivoTrueOrderByTituloAsc(Long tenantId);
    List<Procedimento> findByTenantIdOrderByTituloAsc(Long tenantId);
    List<Procedimento> findByTenantIdAndCategoriaIdAndAtivoTrueOrderByTituloAsc(Long tenantId, Long categoriaId);
}

