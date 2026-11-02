package com.estetica.repository;

import com.estetica.model.HistoricoAtendimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoricoAtendimentoRepository extends JpaRepository<HistoricoAtendimento, Long> {
    List<HistoricoAtendimento> findByClienteIdOrderByDataAtendimentoDesc(Long clienteId);
}

