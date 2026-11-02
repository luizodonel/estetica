package com.estetica.repository;

import com.estetica.model.Lojista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LojistaRepository extends JpaRepository<Lojista, Long> {

    Optional<Lojista> findBySlug(String slug);

    Optional<Lojista> findBySlugIgnoreCase(String slug);

    Optional<Lojista> findByEmail(String email);

    Optional<Lojista> findByEmailIgnoreCase(String email);

    Optional<Lojista> findByLoginIgnoreCase(String login);

    Optional<Lojista> findByTelefoneWhatsApp(String telefoneWhatsApp);

    Optional<Lojista> findByMercadoPagoPaymentId(String mercadoPagoPaymentId);

    boolean existsBySlugIgnoreCase(String slug);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByLoginIgnoreCase(String login);
}
