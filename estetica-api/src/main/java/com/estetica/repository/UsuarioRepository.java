package com.estetica.repository;

import com.estetica.model.Role;
import com.estetica.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);

    Optional<Usuario> findByTelefoneWhatsApp(String telefoneWhatsApp);
    boolean existsByTelefoneWhatsApp(String telefoneWhatsApp);

    List<Usuario> findByRoleOrderByNomeAsc(Role role);
    List<Usuario> findByTenantIdAndRoleOrderByNomeAsc(Long tenantId, Role role);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM Usuario u WHERE u.role = :role AND (:tenantId IS NULL OR u.tenant.id = :tenantId OR u.tenant IS NULL) ORDER BY u.nome ASC")
    List<Usuario> findClientesPorTenantOuSemTenant(@org.springframework.data.repository.query.Param("tenantId") Long tenantId, @org.springframework.data.repository.query.Param("role") Role role);

    long countByRole(Role role);
    long countByTenantIdAndRole(Long tenantId, Role role);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM Usuario u WHERE u.role = :role AND (:tenantId IS NULL OR u.tenant.id = :tenantId OR u.tenant IS NULL)")
    long countClientesPorTenantOuSemTenant(@org.springframework.data.repository.query.Param("tenantId") Long tenantId, @org.springframework.data.repository.query.Param("role") Role role);
}

