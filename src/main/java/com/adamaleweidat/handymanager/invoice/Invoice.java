package com.adamaleweidat.handymanager.invoice;

import com.adamaleweidat.handymanager.job.Job;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @PositiveOrZero
    private BigDecimal amount;

    private LocalDateTime issuedDate;
    private LocalDateTime paidDate;

    @NotNull
    @Enumerated(EnumType.STRING)
    private InvoiceStatus status;

    @ManyToOne
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    public Invoice() {}

    public Invoice(BigDecimal amount, InvoiceStatus status, Job job) {
        this.amount = amount;
        this.status = status;
        this.job = job;
    }

    @PrePersist
    public void prePersist() {
        this.issuedDate = LocalDateTime.now();
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public void setPaidDate(LocalDateTime paidDate) {
        this.paidDate = paidDate;
    }

    public void setStatus(InvoiceStatus status) {
        this.status = status;
    }

    public void setJob(Job job) {
        this.job = job;
    }

    public Long getId() {
        return id;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDateTime getIssuedDate() {
        return issuedDate;
    }

    public LocalDateTime getPaidDate() {
        return paidDate;
    }

    public InvoiceStatus getStatus() {
        return status;
    }

    public Job getJob() {
        return job;
    }
}
