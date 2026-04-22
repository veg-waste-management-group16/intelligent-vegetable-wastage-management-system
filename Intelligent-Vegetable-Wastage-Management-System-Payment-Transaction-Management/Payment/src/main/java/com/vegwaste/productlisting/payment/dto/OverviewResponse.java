package com.vegwaste.productlisting.payment.dto;

import java.util.List;

public class OverviewResponse {
    private long totalTransactions;
    private long successfulTransactions;
    private long failedTransactions;
    private List<PaymentResponse> transactionHistory;

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public long getSuccessfulTransactions() {
        return successfulTransactions;
    }

    public void setSuccessfulTransactions(long successfulTransactions) {
        this.successfulTransactions = successfulTransactions;
    }

    public long getFailedTransactions() {
        return failedTransactions;
    }

    public void setFailedTransactions(long failedTransactions) {
        this.failedTransactions = failedTransactions;
    }

    public List<PaymentResponse> getTransactionHistory() {
        return transactionHistory;
    }

    public void setTransactionHistory(List<PaymentResponse> transactionHistory) {
        this.transactionHistory = transactionHistory;
    }
}
