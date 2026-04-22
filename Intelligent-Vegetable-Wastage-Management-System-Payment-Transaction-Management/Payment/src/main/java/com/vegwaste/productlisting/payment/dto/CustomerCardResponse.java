package com.vegwaste.productlisting.payment.dto;

import java.math.BigDecimal;

public class CustomerCardResponse {
    private Long userId;
    private String name;
    private String email;
    private Long orderId;
    private BigDecimal totalAmount;
    private String orderStatus;
    private String paymentStatus;
    private boolean canProcessPayment;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
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

    public boolean isCanProcessPayment() {
        return canProcessPayment;
    }

    public void setCanProcessPayment(boolean canProcessPayment) {
        this.canProcessPayment = canProcessPayment;
    }
}
