package com.example.demo.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AdminRequestResponse {
    private Long orderId;
    private String customerName;
    private String customerEmail;
    private BigDecimal amount;
    private String orderStatus;
    private String paymentStatus;
    private LocalDateTime orderDate;
    private String agentName;
    private String agentPhone;
    private String agentVehicle;
    private String deliveryStatus;
    private java.time.LocalDate pickupDate;

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public String getAgentName() { return agentName; }
    public void setAgentName(String agentName) { this.agentName = agentName; }

    public String getAgentPhone() { return agentPhone; }
    public void setAgentPhone(String agentPhone) { this.agentPhone = agentPhone; }

    public String getAgentVehicle() { return agentVehicle; }
    public void setAgentVehicle(String agentVehicle) { this.agentVehicle = agentVehicle; }

    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }

    public java.time.LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(java.time.LocalDate pickupDate) { this.pickupDate = pickupDate; }
}
