package com.vegwaste.productlisting.payment.repository;

import com.vegwaste.productlisting.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderOrderId(Long orderId);

    long countByPaymentStatusIgnoreCase(String paymentStatus);

    List<Payment> findAllByOrderByPaymentDateDesc();
}
