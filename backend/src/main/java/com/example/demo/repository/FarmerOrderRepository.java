package com.example.demo.repository;

import com.example.demo.model.FarmerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FarmerOrderRepository extends JpaRepository<FarmerOrder, Integer> {

    // All orders for a farmer, newest first
    List<FarmerOrder> findByFarmerIdOrderByCreatedAtDesc(String farmerId);

    // Orders filtered by status
    List<FarmerOrder> findByFarmerIdAndOrderStatusOrderByCreatedAtDesc(String farmerId, String orderStatus);

    // Orders by stock item
    List<FarmerOrder> findByStockIdOrderByCreatedAtDesc(Integer stockId);

    // Count pending orders for a farmer
    long countByFarmerIdAndOrderStatus(String farmerId, String orderStatus);

    // Orders by customer and status (used for stock restoration on payment rejection)
    List<FarmerOrder> findByCustomerIdAndOrderStatus(String customerId, String orderStatus);

    // All orders for a customer, newest first (used for bill generation)
    List<FarmerOrder> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    // Direct link to payment order (preferred over time-window matching)
    List<FarmerOrder> findByPaymentOrderId(Long paymentOrderId);
}