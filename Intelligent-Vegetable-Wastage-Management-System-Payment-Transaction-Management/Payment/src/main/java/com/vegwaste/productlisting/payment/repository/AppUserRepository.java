package com.vegwaste.productlisting.payment.repository;

import com.vegwaste.productlisting.payment.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    List<AppUser> findByRoleIgnoreCase(String role);
}
