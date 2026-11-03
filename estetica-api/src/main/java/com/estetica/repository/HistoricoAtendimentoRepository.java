package com.estetica.repository;

import com.estetica.model.HistoricoAtendimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoricoAtendimentoRepository extends JpaRepository<HistoricoAtendimento, Long> {
    List<HistoricoAtendimento> findByClienteIdOrderByDataAtendimentoDesc(Long clienteId);

    @Modifying
    @Query("DELETE FROM HistoricoAtendimento h WHERE h.tenant.id = :tenantId OR (h.agendamento IS NOT NULL AND h.agendamento.tenant.id = :tenantId)")
    void deleteByTenantId(@Param("tenantId") Long tenantId);
}

