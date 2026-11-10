package com.estetica.repository;

import com.estetica.model.PostSocial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostSocialRepository extends JpaRepository<PostSocial, Long> {
    List<PostSocial> findTop30ByTenantIdOrderByCriadoEmDesc(Long tenantId);
}
