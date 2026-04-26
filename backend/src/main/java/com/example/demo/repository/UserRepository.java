package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.example.demo.model.User;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Integer> {
    User findByEmail(String email);
    List<User> findByRole(String role);

    // Get the highest farmerIndex number already assigned (e.g. "F007" → 7)
    @Query("SELECT MAX(CAST(SUBSTRING(u.farmerIndex, 2) AS int)) FROM User u WHERE u.role = 'FARMER' AND u.farmerIndex IS NOT NULL")
    Integer findMaxFarmerIndexNumber();
}
