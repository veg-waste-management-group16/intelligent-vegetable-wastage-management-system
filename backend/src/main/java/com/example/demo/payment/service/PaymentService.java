package com.example.demo.payment.service;

import com.example.demo.payment.dto.OverviewResponse;
import com.example.demo.payment.dto.AdminRequestResponse;
import com.example.demo.payment.dto.CustomerCardResponse;
import com.example.demo.payment.dto.PaymentRequest;
import com.example.demo.payment.dto.PaymentResponse;
import com.example.demo.model.User;
import com.example.demo.payment.entity.OrderEntity;
import com.example.demo.repository.UserRepository;
import com.example.demo.payment.entity.Payment;
import com.example.demo.payment.repository.OrderRepository;
import com.example.demo.payment.repository.PaymentRepository;
import com.example.demo.model.FarmerOrder;
import com.example.demo.repository.FarmerStockRepository;
import com.example.demo.repository.FarmerOrderRepository;
import java.time.LocalDateTime;
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
    private final UserRepository userRepository;
    private final FarmerStockRepository farmerStockRepository;
    private final FarmerOrderRepository farmerOrderRepository;

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository, UserRepository userRepository,
            FarmerStockRepository farmerStockRepository, FarmerOrderRepository farmerOrderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.farmerStockRepository = farmerStockRepository;
        this.farmerOrderRepository = farmerOrderRepository;
    }


    @Transactional
    public OrderEntity createOrder(int userId, java.math.BigDecimal totalAmount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        OrderEntity order = new OrderEntity();
        order.setCustomer(user);
        order.setTotalAmount(totalAmount);
        order.setStatus("PENDING_APPROVAL");
        OrderEntity saved = orderRepository.save(order);

        // Link all PENDING FarmerOrders for this customer to this payment order
        String customerId = String.valueOf(userId);
        List<FarmerOrder> pendingItems = farmerOrderRepository.findByCustomerIdAndOrderStatus(customerId, "PENDING");
        for (FarmerOrder fo : pendingItems) {
            fo.setPaymentOrderId(saved.getOrderId());
            farmerOrderRepository.save(fo);
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public java.util.List<OrderEntity> getOrdersByUserId(int userId) {
        return orderRepository.findByCustomerIdOrderByOrderDateDesc(userId);
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
            card.setUserId((long) order.getCustomer().getId());
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
                    row.setAgentName(order.getAgentName());
                    row.setAgentPhone(order.getAgentPhone());
                    row.setAgentVehicle(order.getAgentVehicle());
                    row.setDeliveryStatus(order.getDeliveryStatus());
                    row.setPickupDate(order.getPickupDate());
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
    public void assignDeliveryAgent(Long orderId, String agentName, String agentPhone, String agentVehicle, String deliveryStatus, java.time.LocalDate pickupDate) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        order.setAgentName(agentName);
        order.setAgentPhone(agentPhone);
        order.setAgentVehicle(agentVehicle);
        if (deliveryStatus != null && !deliveryStatus.isBlank()) order.setDeliveryStatus(deliveryStatus);
        if (pickupDate != null) order.setPickupDate(pickupDate);
        orderRepository.save(order);
    }

    @Transactional
    public void rejectOrder(Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found for id: " + orderId));
        order.setStatus("REJECTED");
        orderRepository.save(order);

        // ── Restore stock for every linked FarmerOrder ─────────
        // The payment OrderEntity groups one or more FarmerOrders placed at the same
        // time. We identify them by matching customerId + orderDate (same session).
        // Safer: restore any PENDING FarmerOrder whose customerId matches the customer.
        if (order.getCustomer() != null) {
            String customerId = String.valueOf(order.getCustomer().getId());
            List<FarmerOrder> farmerOrders = farmerOrderRepository.findByCustomerIdAndOrderStatus(customerId, "PENDING");
            for (FarmerOrder fo : farmerOrders) {
                if (fo.getStockId() != null) {
                    farmerStockRepository.findById(fo.getStockId()).ifPresent(stock -> {
                        double restored = stock.getQuantityKg() + fo.getQuantityKg();
                        stock.setQuantityKg(restored);
                        if (restored == 0) stock.setAvailabilityStatus("Out of Stock");
                        else if (restored < 10) stock.setAvailabilityStatus("Low Stock");
                        else stock.setAvailabilityStatus("Available");
                        stock.setUpdatedAt(LocalDateTime.now());
                        farmerStockRepository.save(stock);
                    });
                }
                fo.setOrderStatus("REJECTED");
                farmerOrderRepository.save(fo);
            }
        }
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

    public java.util.Optional<Payment> findPaymentByOrderId(Long orderId) {
        return paymentRepository.findByOrderOrderId(orderId);
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

        // Card format is valid — accept it (Luhn check disabled for internal/test use)
        return true;
    }
}
