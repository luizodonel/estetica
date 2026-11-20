package com.estetica.repository;

import com.estetica.model.SuporteChamado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SuporteChamadoRepository extends JpaRepository<SuporteChamado, Long> {
    Optional<SuporteChamado> findByProtocoloIgnoreCase(String protocolo);
    List<SuporteChamado> findByWhatsappInOrderByAtualizadoEmDesc(List<String> whatsapps);
    boolean existsByProtocoloIgnoreCase(String protocolo);
}
