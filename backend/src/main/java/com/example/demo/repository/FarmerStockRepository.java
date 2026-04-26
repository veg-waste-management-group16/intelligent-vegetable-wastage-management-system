package com.example.demo.repository;

import com.example.demo.model.FarmerStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FarmerStockRepository extends JpaRepository<FarmerStock, Integer> {
    List<FarmerStock> findByFarmerId(String farmerId);
    List<FarmerStock> findByFarmerIdAndCategory(String farmerId, String category);
    List<FarmerStock> findByAvailabilityStatus(String status);
}