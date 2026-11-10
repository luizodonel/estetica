package com.estetica.repository;

import com.estetica.model.RedeSocialConexao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RedeSocialConexaoRepository extends JpaRepository<RedeSocialConexao, Long> {
    Optional<RedeSocialConexao> findFirstByTenantIdAndPlataformaIgnoreCase(Long tenantId, String plataforma);
    List<RedeSocialConexao> findAllByIgUserId(String igUserId);
}
