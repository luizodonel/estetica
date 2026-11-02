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
    Optional<Profissional> findByUsuarioId(Long usuarioId);

    @Query("SELECT p FROM Profissional p JOIN p.procedimentos proc WHERE p.ativo = true AND proc.id = :procedimentoId")
    List<Profissional> findHabilitadosParaProcedimento(@Param("procedimentoId") Long procedimentoId);
}

