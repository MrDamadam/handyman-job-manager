package com.adamaleweidat.handymanager.dto;

import com.adamaleweidat.handymanager.invoice.Invoice;
import com.adamaleweidat.handymanager.invoice.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class InvoiceResponse {

    private Long id;
    private BigDecimal amount;
    private LocalDateTime issuedDate;
    private LocalDateTime paidDate;
    private InvoiceStatus status;
    private Long jobId;
    private String jobTitle;

    public InvoiceResponse() {}

    public InvoiceResponse(Invoice invoice) {
        this.id = invoice.getId();
        this.amount = invoice.getAmount();
        this.issuedDate = invoice.getIssuedDate();
        this.paidDate = invoice.getPaidDate();
        this.status = invoice.getStatus();
        this.jobId = invoice.getJob().getId();
        this.jobTitle = invoice.getJob().getTitle();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDateTime getIssuedDate() {
        return issuedDate;
    }

    public void setIssuedDate(LocalDateTime issuedDate) {
        this.issuedDate = issuedDate;
    }

    public LocalDateTime getPaidDate() {
        return paidDate;
    }

    public void setPaidDate(LocalDateTime paidDate) {
        this.paidDate = paidDate;
    }

    public InvoiceStatus getStatus() {
        return status;
    }

    public void setStatus(InvoiceStatus status) {
        this.status = status;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }
}
