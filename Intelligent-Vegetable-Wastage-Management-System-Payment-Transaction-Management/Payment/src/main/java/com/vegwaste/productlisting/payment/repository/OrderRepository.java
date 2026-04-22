package com.vegwaste.productlisting.payment.repository;

import com.vegwaste.productlisting.payment.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    Optional<OrderEntity> findTopByCustomerUserIdOrderByOrderDateDesc(Long userId);

    List<OrderEntity> findTop50ByOrderByOrderDateDesc();

    long countByStatusIgnoreCase(String status);
}
