package com.example.demo.payment.repository;

import com.example.demo.payment.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    // Main User model uses 'id' not 'userId'
    Optional<OrderEntity> findTopByCustomerIdOrderByOrderDateDesc(int customerId);

    List<OrderEntity> findTop50ByOrderByOrderDateDesc();

    long countByStatusIgnoreCase(String status);

    List<OrderEntity> findByCustomerIdOrderByOrderDateDesc(int customerId);
}
