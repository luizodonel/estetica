package com.estetica.repository;

import com.estetica.model.ClinicaTenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicaTenantRepository extends JpaRepository<ClinicaTenant, Long> {

    Optional<ClinicaTenant> findBySlugIgnoreCase(String slug);

    boolean existsBySlugIgnoreCase(String slug);

    Optional<ClinicaTenant> findByAdminUsuarioId(Long adminUsuarioId);

    Optional<ClinicaTenant> findByMercadoPagoPaymentId(String mercadoPagoPaymentId);

    Optional<ClinicaTenant> findByRenovacaoPaymentId(String renovacaoPaymentId);

    @org.springframework.data.jpa.repository.Query("SELECT t FROM ClinicaTenant t WHERE t.mercadoPagoPaymentId = :paymentId OR t.renovacaoPaymentId = :paymentId")
    Optional<ClinicaTenant> findByQualquerPaymentId(@org.springframework.data.repository.query.Param("paymentId") String paymentId);
}

