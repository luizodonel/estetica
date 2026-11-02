package com.estetica.repository;

import com.estetica.model.BloqueioAgenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BloqueioAgendaRepository extends JpaRepository<BloqueioAgenda, Long> {
    
    @Query("SELECT b FROM BloqueioAgenda b WHERE b.profissional.id = :profissionalId " +
           "AND b.dataInicio < :fim AND b.dataFim > :inicio")
    List<BloqueioAgenda> findBloqueiosNoIntervalo(@Param("profissionalId") Long profissionalId,
                                                @Param("inicio") LocalDateTime inicio,
                                                @Param("fim") LocalDateTime fim);
}

