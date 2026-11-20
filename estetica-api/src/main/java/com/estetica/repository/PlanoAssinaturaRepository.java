package com.estetica.repository;

import com.estetica.model.PlanoAssinatura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanoAssinaturaRepository extends JpaRepository<PlanoAssinatura, Long> {
    List<PlanoAssinatura> findAllByAtivoTrueOrderByOrdemExibicaoAsc();
    Optional<PlanoAssinatura> findByCodigoIgnoreCase(String codigo);
}
