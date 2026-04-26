package com.example.demo.payment.controller;

import com.example.demo.payment.dto.OverviewResponse;
import com.example.demo.payment.dto.AdminRequestResponse;
import com.example.demo.payment.dto.CustomerCardResponse;
import com.example.demo.payment.dto.PaymentRequest;
import com.example.demo.payment.dto.PaymentResponse;
import com.example.demo.payment.service.PaymentService;
import com.example.demo.payment.repository.OrderRepository;
import com.example.demo.repository.FarmerOrderRepository;
import com.example.demo.model.FarmerOrder;
import com.example.demo.payment.entity.OrderEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;
    private final OrderRepository orderRepository;
    private final FarmerOrderRepository farmerOrderRepository;

    public PaymentController(PaymentService paymentService, OrderRepository orderRepository, FarmerOrderRepository farmerOrderRepository) {
        this.paymentService = paymentService;
        this.orderRepository = orderRepository;
        this.farmerOrderRepository = farmerOrderRepository;
    }

    @PostMapping("/process")
    public ResponseEntity<PaymentResponse> processPayment(@RequestBody PaymentRequest request) {
        log.info("PaymentController->processPayment->started");
        return ResponseEntity.ok(paymentService.processPayment(request));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentById(paymentId));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getPaymentByOrderId(orderId));
    }

    @GetMapping("/overview")
    public ResponseEntity<OverviewResponse> getOverview() {
        return ResponseEntity.ok(paymentService.getOverview());
    }

    @GetMapping("/customers/dashboard")
    public ResponseEntity<List<CustomerCardResponse>> getCustomerDashboardCards() {
        return ResponseEntity.ok(paymentService.getCustomerDashboardCards());
    }

    @GetMapping("/admin/requests")
    public ResponseEntity<List<AdminRequestResponse>> getAdminRequests() {
        return ResponseEntity.ok(paymentService.getAdminRequests());
    }

    @PostMapping("/admin/requests/{orderId}/approve")
    public ResponseEntity<Void> approveOrder(@PathVariable Long orderId) {
        paymentService.approveOrder(orderId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/admin/requests/{orderId}/reject")
    public ResponseEntity<Void> rejectOrder(@PathVariable Long orderId) {
        paymentService.rejectOrder(orderId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/admin/orders/{orderId}/delivery-agent")
    public ResponseEntity<Void> assignDeliveryAgent(@PathVariable Long orderId, @RequestBody Map<String, Object> body) {
        String agentName    = (String) body.get("agentName");
        String agentPhone   = (String) body.get("agentPhone");
        String agentVehicle = (String) body.get("agentVehicle");
        String deliveryStatus = (String) body.getOrDefault("deliveryStatus", "ASSIGNED");
        java.time.LocalDate pickupDate = body.get("pickupDate") != null
            ? java.time.LocalDate.parse(body.get("pickupDate").toString()) : null;
        paymentService.assignDeliveryAgent(orderId, agentName, agentPhone, agentVehicle, deliveryStatus, pickupDate);
        return ResponseEntity.ok().build();
    }

    // Farmer-facing: get delivery info for orders (no customer details)
    @GetMapping("/orders/farmer-delivery/{farmerId}")
    public ResponseEntity<List<Map<String, Object>>> getDeliveryInfoForFarmer(@PathVariable String farmerId) {
        // Returns all paid/approved orders — farmer sees pickup date and delivery agent but NOT customer details
        List<OrderEntity> orders = orderRepository.findTop50ByOrderByOrderDateDesc();
        List<Map<String, Object>> result = orders.stream()
            .filter(o -> o.getAgentName() != null || o.getPickupDate() != null)
            .map(o -> {
                Map<String, Object> m = new java.util.HashMap<>();
                m.put("orderId", o.getOrderId());
                m.put("status", o.getStatus());
                m.put("totalAmount", o.getTotalAmount());
                m.put("orderDate", o.getOrderDate());
                m.put("pickupDate", o.getPickupDate() != null ? o.getPickupDate().toString() : null);
                m.put("agentName", o.getAgentName());
                m.put("agentPhone", o.getAgentPhone());
                m.put("agentVehicle", o.getAgentVehicle());
                m.put("deliveryStatus", o.getDeliveryStatus());
                // No customer name/address/email exposed to farmer
                return m;
            }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/admin/report")
    public ResponseEntity<String> downloadReport() {
        String csv = paymentService.generateAdminReportCsv();
        String filename = "payment-report-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @PostMapping("/orders/create")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> body) {
        int userId = Integer.parseInt(body.get("userId").toString());
        BigDecimal amount = new BigDecimal(body.get("totalAmount").toString());
        OrderEntity order = paymentService.createOrder(userId, amount);
        return ResponseEntity.ok(Map.of(
            "orderId", order.getOrderId(),
            "status", order.getStatus(),
            "totalAmount", order.getTotalAmount()
        ));
    }

    @GetMapping("/orders/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getMyOrders(@PathVariable int userId) {
        List<OrderEntity> orders = paymentService.getOrdersByUserId(userId);
        List<Map<String, Object>> result = orders.stream().map(o -> {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("orderId", o.getOrderId());
            m.put("totalAmount", o.getTotalAmount());
            m.put("status", o.getStatus());
            m.put("orderDate", o.getOrderDate());
            paymentService.findPaymentByOrderId(o.getOrderId()).ifPresent(p -> {
                m.put("paymentStatus", p.getPaymentStatus());
                m.put("transactionId", p.getTransactionReference());
                m.put("paymentDate", p.getPaymentDate());
            });
            // Delivery agent info for customer
            if (o.getAgentName() != null) m.put("agentName", o.getAgentName());
            if (o.getAgentPhone() != null) m.put("agentPhone", o.getAgentPhone());
            if (o.getAgentVehicle() != null) m.put("agentVehicle", o.getAgentVehicle());
            if (o.getDeliveryStatus() != null) m.put("deliveryStatus", o.getDeliveryStatus());
            if (o.getPickupDate() != null) m.put("pickupDate", o.getPickupDate().toString());
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }
    // ── Admin: update order status (e.g. mark DELIVERED) ──────
    @PatchMapping("/admin/orders/{orderId}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable Long orderId, @RequestBody Map<String, Object> body) {
        String newStatus = (String) body.get("status");
        if (newStatus == null || newStatus.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        order.setStatus(newStatus.toUpperCase());
        orderRepository.save(order);
        return ResponseEntity.ok(Map.of("orderId", orderId, "status", order.getStatus()));
    }

    // ── Bill detail: admin view (includes farmer info) ─────────
    @GetMapping("/admin/orders/{orderId}/bill")
    public ResponseEntity<Map<String, Object>> getAdminOrderBill(@PathVariable Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        Map<String, Object> bill = buildBill(order, true);
        return ResponseEntity.ok(bill);
    }

    // ── Bill detail: customer view (no pickup date, same structure) ─
    @GetMapping("/orders/{orderId}/bill")
    public ResponseEntity<Map<String, Object>> getCustomerOrderBill(@PathVariable Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        Map<String, Object> bill = buildBill(order, false);
        return ResponseEntity.ok(bill);
    }

    private Map<String, Object> buildBill(OrderEntity order, boolean includePickupDate) {
        Map<String, Object> bill = new java.util.HashMap<>();
        bill.put("orderId", order.getOrderId());
        bill.put("orderDate", order.getOrderDate());
        bill.put("status", order.getStatus());
        bill.put("totalAmount", order.getTotalAmount());

        // Customer info
        if (order.getCustomer() != null) {
            Map<String, Object> cust = new java.util.HashMap<>();
            cust.put("name", order.getCustomer().getName());
            cust.put("email", order.getCustomer().getEmail());
            cust.put("phone", order.getCustomer().getPhone());
            cust.put("deliveryAddress", order.getCustomer().getDeliveryAddress());
            bill.put("customer", cust);
        }

        // Payment info
        paymentService.findPaymentByOrderId(order.getOrderId()).ifPresent(p -> {
            Map<String, Object> pay = new java.util.HashMap<>();
            pay.put("transactionId", p.getTransactionReference());
            pay.put("method", p.getPaymentMethod());
            pay.put("status", p.getPaymentStatus());
            pay.put("date", p.getPaymentDate());
            bill.put("payment", pay);
        });

        // Delivery agent
        if (order.getAgentName() != null) {
            Map<String, Object> agent = new java.util.HashMap<>();
            agent.put("name", order.getAgentName());
            agent.put("phone", order.getAgentPhone());
            agent.put("vehicle", order.getAgentVehicle());
            agent.put("deliveryStatus", order.getDeliveryStatus());
            if (includePickupDate && order.getPickupDate() != null)
                agent.put("pickupDate", order.getPickupDate().toString());
            bill.put("deliveryAgent", agent);
        }

        // Line items from FarmerOrders — use direct paymentOrderId link first,
        // fall back to time-window matching for legacy orders placed before this fix.
        java.util.List<FarmerOrder> matchedOrders = farmerOrderRepository.findByPaymentOrderId(order.getOrderId());

        if (matchedOrders.isEmpty()) {
            // Legacy fallback: match by customerId within a 60-minute window
            String customerId = order.getCustomer() != null
                    ? String.valueOf(order.getCustomer().getId()) : null;
            if (customerId != null) {
                java.time.LocalDateTime orderTime = order.getOrderDate();
                matchedOrders = farmerOrderRepository
                        .findByCustomerIdOrderByCreatedAtDesc(customerId)
                        .stream()
                        .filter(fo -> {
                            if (fo.getCreatedAt() == null || orderTime == null) return false;
                            long diffSeconds = Math.abs(java.time.Duration.between(fo.getCreatedAt(), orderTime).getSeconds());
                            return diffSeconds <= 3600; // widen to 60 minutes for legacy orders
                        })
                        .toList();
            }
        }

        java.util.List<Map<String, Object>> items = matchedOrders.stream()
                .map(fo -> {
                    Map<String, Object> item = new java.util.HashMap<>();
                    item.put("farmerOrderId", fo.getOrderId());
                    item.put("vegetableName", fo.getVegetableName());
                    item.put("quantityKg", fo.getQuantityKg());
                    item.put("pricePerKg", fo.getPricePerKg());
                    item.put("totalAmount", fo.getTotalAmount());
                    item.put("farmerId", fo.getFarmerId());
                    item.put("orderStatus", fo.getOrderStatus());
                    if (fo.getDeliveryAddress() != null) item.put("deliveryAddress", fo.getDeliveryAddress());
                    return item;
                }).toList();
        bill.put("items", items);

        return bill;
    }

}