package com.vegwaste.productlisting.payment.controller;

import com.vegwaste.productlisting.payment.dto.OverviewResponse;
import com.vegwaste.productlisting.payment.dto.AdminRequestResponse;
import com.vegwaste.productlisting.payment.dto.CustomerCardResponse;
import com.vegwaste.productlisting.payment.dto.PaymentRequest;
import com.vegwaste.productlisting.payment.dto.PaymentResponse;
import com.vegwaste.productlisting.payment.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
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

    @GetMapping("/admin/report")
    public ResponseEntity<String> downloadReport() {
        String csv = paymentService.generateAdminReportCsv();
        String filename = "payment-report-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
