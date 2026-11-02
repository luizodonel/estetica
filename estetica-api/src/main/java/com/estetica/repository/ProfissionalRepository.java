package com.estetica.repository;

import com.estetica.model.Profissional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfissionalRepository extends JpaRepository<Profissional, Long> {
    List<Profissional> findByAtivoTrueOrderByNomeAsc();
    List<Profissional> findByTenantIdAndAtivoTrueOrderByNomeAsc(Long tenantId);
    List<Profissional> findByTenantIdOrderByNomeAsc(Long tenantId);

    Optional<Profissional> findByUsuarioId(Long usuarioId);

    @Query("SELECT p FROM Profissional p JOIN p.procedimentos proc WHERE p.ativo = true AND proc.id = :procedimentoId")
    List<Profissional> findHabilitadosParaProcedimento(@Param("procedimentoId") Long procedimentoId);

    @Query("SELECT p FROM Profissional p JOIN p.procedimentos proc WHERE p.ativo = true AND p.tenant.id = :tenantId AND proc.id = :procedimentoId")
    List<Profissional> findHabilitadosParaProcedimentoETenant(@Param("procedimentoId") Long procedimentoId, @Param("tenantId") Long tenantId);
}

