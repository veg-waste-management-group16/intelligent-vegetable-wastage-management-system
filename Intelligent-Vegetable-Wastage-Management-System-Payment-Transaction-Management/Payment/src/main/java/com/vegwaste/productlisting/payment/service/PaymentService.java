package com.vegwaste.productlisting.payment.service;

import com.vegwaste.productlisting.payment.dto.OverviewResponse;
import com.vegwaste.productlisting.payment.dto.AdminRequestResponse;
import com.vegwaste.productlisting.payment.dto.CustomerCardResponse;
import com.vegwaste.productlisting.payment.dto.PaymentRequest;
import com.vegwaste.productlisting.payment.dto.PaymentResponse;
import com.vegwaste.productlisting.payment.entity.OrderEntity;
import com.vegwaste.productlisting.payment.entity.Payment;
import com.vegwaste.productlisting.payment.repository.OrderRepository;
import com.vegwaste.productlisting.payment.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("PaymentService->processPayment->started");
        if (request.getOrderId() == null) {
            log.error("ERROR : IllegalArgumentException");
            throw new IllegalArgumentException("orderId is required.");

        }

        if (request.getPaymentMethod() == null || request.getPaymentMethod().isBlank()) {
            throw new IllegalArgumentException("paymentMethod is required.");
        }

        OrderEntity order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found for id: " + request.getOrderId()));

        if (!"APPROVED".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalArgumentException("Order is not approved by admin yet.");
        }

        paymentRepository.findByOrderOrderId(order.getOrderId()).ifPresent(existing -> {
            throw new IllegalArgumentException("Payment already exists for order: " + order.getOrderId());
        });

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setPaymentMethod(request.getPaymentMethod());

        String status = validateCard(request) ? "SUCCESS" : "FAILED";
        payment.setPaymentStatus(status);
        payment.setTransactionReference(generateTransactionId());

        Payment saved = paymentRepository.save(payment);

        order.setStatus("SUCCESS".equals(status) ? "PAID" : "PAYMENT_FAILED");
        orderRepository.save(order);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for id: " + paymentId));
        return toResponse(payment);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for order id: " + orderId));
        return toResponse(payment);
    }

    @Transactional(readOnly = true)
    public OverviewResponse getOverview() {
        OverviewResponse overview = new OverviewResponse();
        long success = paymentRepository.countByPaymentStatusIgnoreCase("SUCCESS");
        long paymentFailed = paymentRepository.countByPaymentStatusIgnoreCase("FAILED");
        long rejected = orderRepository.countByStatusIgnoreCase("REJECTED");
        long failed = paymentFailed + rejected;

        List<PaymentResponse> paymentHistory = paymentRepository.findAllByOrderByPaymentDateDesc()
                .stream()
                .map(this::toResponse)
                .toList();

        List<PaymentResponse> rejectedHistory = orderRepository.findTop50ByOrderByOrderDateDesc().stream()
                .filter(order -> "REJECTED".equalsIgnoreCase(order.getStatus()))
                .map(this::toRejectedHistoryRow)
                .toList();

        List<PaymentResponse> history = new java.util.ArrayList<>(paymentHistory);
        history.addAll(rejectedHistory);
        history.sort((a, b) -> {
            if (a.getPaymentDate() == null && b.getPaymentDate() == null) return 0;
            if (a.getPaymentDate() == null) return 1;
            if (b.getPaymentDate() == null) return -1;
            return b.getPaymentDate().compareTo(a.getPaymentDate());
        });

        long total = success + failed;
        overview.setTotalTransactions(total);
        overview.setSuccessfulTransactions(success);
        overview.setFailedTransactions(failed);
        overview.setTransactionHistory(history);
        return overview;
    }

    @Transactional(readOnly = true)
    public List<CustomerCardResponse> getCustomerDashboardCards() {
        return orderRepository.findTop50ByOrderByOrderDateDesc().stream()
                .filter(order -> order.getCustomer() != null
                        && order.getCustomer().getRole() != null
                        && "CUSTOMER".equalsIgnoreCase(order.getCustomer().getRole()))
                .map(order -> {
            CustomerCardResponse card = new CustomerCardResponse();
            card.setUserId(order.getCustomer().getUserId());
            card.setName(order.getCustomer().getName());
            card.setEmail(order.getCustomer().getEmail());
            card.setOrderId(order.getOrderId());
            card.setTotalAmount(order.getTotalAmount());
            card.setOrderStatus(order.getStatus());

            paymentRepository.findByOrderOrderId(order.getOrderId()).ifPresentOrElse(payment -> {
                card.setPaymentStatus(payment.getPaymentStatus());
                boolean approved = "APPROVED".equalsIgnoreCase(order.getStatus());
                card.setCanProcessPayment(approved && !"SUCCESS".equalsIgnoreCase(payment.getPaymentStatus()));
            }, () -> {
                card.setPaymentStatus("NOT_PAID");
                card.setCanProcessPayment("APPROVED".equalsIgnoreCase(order.getStatus()));
            });
            return card;
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminRequestResponse> getAdminRequests() {
        return orderRepository.findTop50ByOrderByOrderDateDesc().stream()
                .map(order -> {
                    AdminRequestResponse row = new AdminRequestResponse();
                    row.setOrderId(order.getOrderId());
                    row.setCustomerName(order.getCustomer().getName());
                    row.setCustomerEmail(order.getCustomer().getEmail());
                    row.setAmount(order.getTotalAmount());
                    row.setOrderStatus(order.getStatus());
                    row.setOrderDate(order.getOrderDate());
                    row.setPaymentStatus(paymentRepository.findByOrderOrderId(order.getOrderId())
                            .map(Payment::getPaymentStatus)
                            .orElse("NOT_PAID"));
                    return row;
                })
                .toList();
    }

    @Transactional
    public void approveOrder(Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found for id: " + orderId));
        order.setStatus("APPROVED");
        orderRepository.save(order);
    }

    @Transactional
    public void rejectOrder(Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found for id: " + orderId));
        order.setStatus("REJECTED");
        orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public String generateAdminReportCsv() {
        List<AdminRequestResponse> rows = getAdminRequests();
        String header = "Order ID,Customer Name,Customer Email,Amount,Order Status,Payment Status,Order Date\n";
        String body = rows.stream()
                .map(row -> String.format("%d,%s,%s,%.2f,%s,%s,%s",
                        row.getOrderId(),
                        sanitize(row.getCustomerName()),
                        sanitize(row.getCustomerEmail()),
                        row.getAmount() == null ? 0.0 : row.getAmount().doubleValue(),
                        sanitize(row.getOrderStatus()),
                        sanitize(row.getPaymentStatus()),
                        row.getOrderDate() == null ? "" : row.getOrderDate()))
                .collect(Collectors.joining("\n"));
        return header + body;
    }

    private String sanitize(String value) {
        if (value == null) {
            return "";
        }
        return value.replace(",", " ");
    }

    private PaymentResponse toResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse();
        response.setPaymentId(payment.getPaymentId());
        response.setOrderId(payment.getOrder().getOrderId());
        response.setTransactionId(payment.getTransactionReference());
        response.setPaymentStatus(payment.getPaymentStatus());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setAmountPaid(payment.getOrder().getTotalAmount());
        response.setPaymentDate(payment.getPaymentDate());
        return response;
    }

    private PaymentResponse toRejectedHistoryRow(OrderEntity order) {
        PaymentResponse response = new PaymentResponse();
        response.setPaymentId(null);
        response.setOrderId(order.getOrderId());
        response.setTransactionId("REJECTED-ORD" + order.getOrderId());
        response.setPaymentStatus("FAILED");
        response.setPaymentMethod("N/A");
        response.setAmountPaid(order.getTotalAmount());
        response.setPaymentDate(order.getOrderDate());
        return response;
    }

    private String generateTransactionId() {
        return "TXN" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private boolean validateCard(PaymentRequest request) {
        if (!"Credit/Debit Card".equalsIgnoreCase(request.getPaymentMethod())
                && !"CARD".equalsIgnoreCase(request.getPaymentMethod())) {
            return true;
        }

        if (request.getCardNumber() == null || !request.getCardNumber().matches("\\d{12,19}")) {
            return false;
        }

        if (request.getCvv() == null || !request.getCvv().matches("\\d{3,4}")) {
            return false;
        }

        if (request.getExpiryDate() == null || request.getExpiryDate().isBlank()) {
            return false;
        }

        if (!request.getExpiryDate().matches("(0[1-9]|1[0-2])/\\d{2}")) {
            return false;
        }

        return isValidLuhn(request.getCardNumber());
    }

    private boolean isValidLuhn(String cardNumber) {
        if (cardNumber == null || cardNumber.isBlank()) return false;
        int sum = 0;
        boolean alternate = false;
        for (int i = cardNumber.length() - 1; i >= 0; i--) {
            int n = Integer.parseInt(cardNumber.substring(i, i + 1));
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n = (n % 10) + 1;
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return (sum % 10 == 0);
    }
}
