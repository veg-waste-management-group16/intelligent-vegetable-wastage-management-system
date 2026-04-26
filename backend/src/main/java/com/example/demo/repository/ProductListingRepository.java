package com.example.demo.repository;

import com.example.demo.model.ProductListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProductListingRepository extends JpaRepository<ProductListing, Integer> {

    List<ProductListing> findByIsVisible(Boolean isVisible);

    List<ProductListing> findByFarmerId(Integer farmerId);

    List<ProductListing> findByTitleContainingIgnoreCase(String keyword);

    List<ProductListing> findByCategoryIgnoreCase(String category);

    @Query("SELECT p FROM ProductListing p WHERE p.expiresAt < :now")
    List<ProductListing> findExpiredListings(LocalDateTime now);

    @Modifying
    @Query("DELETE FROM ProductListing p WHERE p.expiresAt < :now")
    void deleteExpiredListings(LocalDateTime now);
}
