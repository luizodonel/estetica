package com.estetica.repository;

import com.estetica.model.PlanoAssinatura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanoAssinaturaRepository extends JpaRepository<PlanoAssinatura, Long> {
    List<PlanoAssinatura> findAllByAtivoTrueOrderByOrdemExibicaoAsc();
    Optional<PlanoAssinatura> findByCodigoIgnoreCase(String codigo);

    @Modifying
    @Query(
            value = "UPDATE tb_plano_assinatura SET " +
                    "promocao_usos_atuais = promocao_usos_atuais + 1, " +
                    "promocional = CASE WHEN promocao_limite_usos IS NOT NULL AND promocao_limite_usos > 0 " +
                    "AND promocao_usos_atuais + 1 >= promocao_limite_usos THEN FALSE ELSE promocional END, " +
                    "atualizado_em = NOW() " +
                    "WHERE UPPER(codigo) = UPPER(:codigo) AND promocional = TRUE",
            nativeQuery = true
    )
    int incrementarUsoPromocaoAtomico(@Param("codigo") String codigo);
}
