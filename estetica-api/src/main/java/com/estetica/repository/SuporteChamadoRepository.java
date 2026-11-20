package com.estetica.repository;

import com.estetica.model.SuporteChamado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuporteChamadoRepository extends JpaRepository<SuporteChamado, Long> {

    boolean existsByProtocoloIgnoreCase(String protocolo);

    @Query("SELECT c FROM SuporteChamado c " +
           "WHERE (:lojistaId IS NOT NULL AND c.lojistaId = :lojistaId) " +
           "OR (:tenantId IS NOT NULL AND c.tenantId = :tenantId) " +
           "OR (:usuarioId IS NOT NULL AND c.usuarioId = :usuarioId) " +
           "ORDER BY c.atualizadoEm DESC, c.id DESC")
    List<SuporteChamado> findMeusChamados(@Param("lojistaId") Long lojistaId,
                                          @Param("tenantId") Long tenantId,
                                          @Param("usuarioId") Long usuarioId);

    List<SuporteChamado> findByUsuarioIdOrderByAtualizadoEmDesc(Long usuarioId);
}
