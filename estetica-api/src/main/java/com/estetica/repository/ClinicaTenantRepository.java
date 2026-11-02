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
}

