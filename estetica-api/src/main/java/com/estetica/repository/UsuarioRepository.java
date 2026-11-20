package com.estetica.repository;

import com.estetica.model.Role;
import com.estetica.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByLoginIgnoreCase(String login);
    List<Usuario> findAllByLoginIgnoreCase(String login);
    boolean existsByLoginIgnoreCase(String login);
    Optional<Usuario> findFirstByTenantIdAndLoginIgnoreCase(Long tenantId, String login);
    boolean existsByTenantIdAndLoginIgnoreCase(Long tenantId, String login);

    List<Usuario> findAllByNomeIgnoreCase(String nome);
    List<Usuario> findAllByRole(Role role);

    Optional<Usuario> findByEmail(String email);
    List<Usuario> findAllByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
    Optional<Usuario> findFirstByTenantIdAndEmailIgnoreCase(Long tenantId, String email);
    boolean existsByTenantIdAndEmailIgnoreCase(Long tenantId, String email);

    Optional<Usuario> findByTelefoneWhatsApp(String telefoneWhatsApp);
    List<Usuario> findAllByTelefoneWhatsApp(String telefoneWhatsApp);
    boolean existsByTelefoneWhatsApp(String telefoneWhatsApp);
    Optional<Usuario> findFirstByTenantIdAndTelefoneWhatsApp(Long tenantId, String telefoneWhatsApp);
    Optional<Usuario> findFirstByTenantIdAndTelefoneWhatsAppAndNomeIgnoreCase(Long tenantId, String telefoneWhatsApp, String nome);
    Optional<Usuario> findFirstByTelefoneWhatsAppAndNomeIgnoreCase(String telefoneWhatsApp, String nome);
    boolean existsByTenantIdAndTelefoneWhatsApp(Long tenantId, String telefoneWhatsApp);

    List<Usuario> findByRoleOrderByNomeAsc(Role role);
    List<Usuario> findByTenantIdAndRoleOrderByNomeAsc(Long tenantId, Role role);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u FROM Usuario u WHERE u.role = :role AND (:tenantId IS NULL OR u.tenant.id = :tenantId OR u.id IN (SELECT a.cliente.id FROM Agendamento a WHERE a.tenant.id = :tenantId OR a.profissional.tenant.id = :tenantId)) ORDER BY u.nome ASC")
    List<Usuario> findClientesPorTenantOuSemTenant(@org.springframework.data.repository.query.Param("tenantId") Long tenantId, @org.springframework.data.repository.query.Param("role") Role role);

    long countByRole(Role role);
    long countByTenantIdAndRole(Long tenantId, Role role);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT u.id) FROM Usuario u WHERE u.role = :role AND (:tenantId IS NULL OR u.tenant.id = :tenantId OR u.id IN (SELECT a.cliente.id FROM Agendamento a WHERE a.tenant.id = :tenantId OR a.profissional.tenant.id = :tenantId))")
    long countClientesPorTenantOuSemTenant(@org.springframework.data.repository.query.Param("tenantId") Long tenantId, @org.springframework.data.repository.query.Param("role") Role role);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT a.cliente FROM Agendamento a WHERE a.profissional.id = :profissionalId AND a.status != com.estetica.model.StatusAgendamento.CANCELADO ORDER BY a.cliente.nome ASC")
    List<Usuario> findClientesPorProfissional(@org.springframework.data.repository.query.Param("profissionalId") Long profissionalId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT a.cliente.id) FROM Agendamento a WHERE a.profissional.id = :profissionalId AND a.status != com.estetica.model.StatusAgendamento.CANCELADO")
    long countClientesPorProfissional(@org.springframework.data.repository.query.Param("profissionalId") Long profissionalId);
}

