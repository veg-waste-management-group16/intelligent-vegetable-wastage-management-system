package com.vegwaste.productlisting.payment.service;

import com.vegwaste.productlisting.payment.dto.OverviewResponse;
import com.vegwaste.productlisting.payment.dto.PaymentRequest;
import com.vegwaste.productlisting.payment.dto.PaymentResponse;
import com.vegwaste.productlisting.payment.entity.AppUser;
import com.vegwaste.productlisting.payment.entity.OrderEntity;
import com.vegwaste.productlisting.payment.entity.Payment;
import com.vegwaste.productlisting.payment.repository.OrderRepository;
import com.vegwaste.productlisting.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private PaymentService paymentService;

    private OrderEntity approvedOrder;

    @BeforeEach
    void setUp() {
        AppUser customer = new AppUser();
        customer.setUserId(10L);
        customer.setName("John");
        customer.setEmail("john@example.com");
        customer.setRole("CUSTOMER");

        approvedOrder = new OrderEntity();
        approvedOrder.setOrderId(123L);
        approvedOrder.setCustomer(customer);
        approvedOrder.setTotalAmount(BigDecimal.valueOf(500.00));
        approvedOrder.setStatus("APPROVED");
        approvedOrder.setOrderDate(LocalDateTime.now());
    }

    @Test
    void processPayment_success_whenOrderApprovedAndCardValid() {
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(123L);
        request.setPaymentMethod("Credit/Debit Card");
        request.setCardNumber("4111111111111111");
        request.setExpiryDate("12/30");
        request.setCvv("123");

        when(orderRepository.findById(123L)).thenReturn(Optional.of(approvedOrder));
        when(paymentRepository.findByOrderOrderId(123L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setPaymentId(1L);
            payment.setPaymentDate(LocalDateTime.now());
            return payment;
        });
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.processPayment(request);

        assertEquals(123L, response.getOrderId());
        assertEquals("SUCCESS", response.getPaymentStatus());
        assertEquals("PAID", approvedOrder.getStatus());
        verify(paymentRepository).save(any(Payment.class));
        verify(orderRepository).save(approvedOrder);
    }

    @Test
    void processPayment_throws_whenOrderNotApproved() {
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(200L);
        request.setPaymentMethod("Credit/Debit Card");
        request.setCardNumber("123456789012");
        request.setExpiryDate("12/30");
        request.setCvv("123");

        OrderEntity pendingOrder = new OrderEntity();
        pendingOrder.setOrderId(200L);
        pendingOrder.setStatus("PENDING_APPROVAL");
        pendingOrder.setCustomer(approvedOrder.getCustomer());
        pendingOrder.setTotalAmount(BigDecimal.valueOf(1000));

        when(orderRepository.findById(200L)).thenReturn(Optional.of(pendingOrder));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> paymentService.processPayment(request));

        assertEquals("Order is not approved by admin yet.", ex.getMessage());
    }

    @Test
    void rejectOrder_updatesOrderStatusToRejected() {
        when(orderRepository.findById(123L)).thenReturn(Optional.of(approvedOrder));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        paymentService.rejectOrder(123L);

        assertEquals("REJECTED", approvedOrder.getStatus());
        verify(orderRepository).save(approvedOrder);
    }

    @Test
    void getOverview_countsRejectedAsFailedAndIncludesInHistory() {
        when(paymentRepository.countByPaymentStatusIgnoreCase("SUCCESS")).thenReturn(1L);
        when(paymentRepository.countByPaymentStatusIgnoreCase("FAILED")).thenReturn(0L);
        when(orderRepository.countByStatusIgnoreCase("REJECTED")).thenReturn(1L);

        Payment successPayment = new Payment();
        successPayment.setPaymentId(10L);
        successPayment.setPaymentStatus("SUCCESS");
        successPayment.setPaymentMethod("CARD");
        successPayment.setTransactionReference("TXN0001");
        successPayment.setPaymentDate(LocalDateTime.now());
        successPayment.setOrder(approvedOrder);

        OrderEntity rejectedOrder = new OrderEntity();
        rejectedOrder.setOrderId(124L);
        rejectedOrder.setStatus("REJECTED");
        rejectedOrder.setOrderDate(LocalDateTime.now().minusHours(1));
        rejectedOrder.setTotalAmount(BigDecimal.valueOf(850));
        rejectedOrder.setCustomer(approvedOrder.getCustomer());

        when(paymentRepository.findAllByOrderByPaymentDateDesc()).thenReturn(List.of(successPayment));
        when(orderRepository.findTop50ByOrderByOrderDateDesc()).thenReturn(List.of(rejectedOrder));

        OverviewResponse overview = paymentService.getOverview();

        assertEquals(2L, overview.getTotalTransactions());
        assertEquals(1L, overview.getSuccessfulTransactions());
        assertEquals(1L, overview.getFailedTransactions());
        assertTrue(overview.getTransactionHistory().stream()
                .anyMatch(t -> "REJECTED-ORD124".equals(t.getTransactionId()) && "FAILED".equals(t.getPaymentStatus())));
    }

    @Test
    void getCustomerDashboardCards_enablesProcessOnlyForApprovedUnpaidOrders() {
        OrderEntity approved = new OrderEntity();
        approved.setOrderId(300L);
        approved.setStatus("APPROVED");
        approved.setOrderDate(LocalDateTime.now());
        approved.setTotalAmount(BigDecimal.valueOf(200));
        approved.setCustomer(approvedOrder.getCustomer());

        OrderEntity rejected = new OrderEntity();
        rejected.setOrderId(301L);
        rejected.setStatus("REJECTED");
        rejected.setOrderDate(LocalDateTime.now().minusDays(1));
        rejected.setTotalAmount(BigDecimal.valueOf(300));
        rejected.setCustomer(approvedOrder.getCustomer());

        when(orderRepository.findTop50ByOrderByOrderDateDesc()).thenReturn(List.of(approved, rejected));
        when(paymentRepository.findByOrderOrderId(300L)).thenReturn(Optional.empty());
        when(paymentRepository.findByOrderOrderId(301L)).thenReturn(Optional.empty());

        var cards = paymentService.getCustomerDashboardCards();

        assertEquals(2, cards.size());
        assertTrue(cards.stream().anyMatch(c -> c.getOrderId().equals(300L) && c.isCanProcessPayment()));
        assertTrue(cards.stream().anyMatch(c -> c.getOrderId().equals(301L) && !c.isCanProcessPayment()));
    }
}
