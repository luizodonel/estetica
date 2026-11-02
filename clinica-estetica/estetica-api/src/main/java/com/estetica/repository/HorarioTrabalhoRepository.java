package com.estetica.repository;

import com.estetica.model.HorarioTrabalho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Repository
public interface HorarioTrabalhoRepository extends JpaRepository<HorarioTrabalho, Long> {
    List<HorarioTrabalho> findByProfissionalIdAndAtivoTrue(Long profissionalId);
    Optional<HorarioTrabalho> findByProfissionalIdAndDiaSemanaAndAtivoTrue(Long profissionalId, DayOfWeek diaSemana);
}

