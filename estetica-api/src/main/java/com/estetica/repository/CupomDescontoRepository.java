package com.estetica.repository;

import com.estetica.model.CupomDesconto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CupomDescontoRepository extends JpaRepository<CupomDesconto, Long> {

    Optional<CupomDesconto> findByCodigoIgnoreCase(String codigo);

    @Modifying
    @Query(
            value = "UPDATE tb_cupom_desconto SET usos_atuais = usos_atuais + 1, atualizado_em = NOW() " +
                    "WHERE UPPER(codigo) = UPPER(:codigo) " +
                    "AND (limite_usos IS NULL OR limite_usos <= 0 OR usos_atuais < limite_usos)",
            nativeQuery = true
    )
    int incrementarUsoAtomico(@Param("codigo") String codigo);
}
