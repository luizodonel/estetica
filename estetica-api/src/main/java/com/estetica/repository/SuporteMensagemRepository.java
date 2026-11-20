package com.estetica.repository;

import com.estetica.model.SuporteMensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuporteMensagemRepository extends JpaRepository<SuporteMensagem, Long> {
    List<SuporteMensagem> findByChamadoIdOrderByCriadoEmAscIdAsc(Long chamadoId);
}
