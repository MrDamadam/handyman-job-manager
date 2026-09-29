package com.adamaleweidat.handymanager.payment;

import com.adamaleweidat.handymanager.invoice.Invoice;
import com.adamaleweidat.handymanager.invoice.InvoiceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceService invoiceService;

    public PaymentService(PaymentRepository paymentRepository, InvoiceService invoiceService) {
        this.paymentRepository = paymentRepository;
        this.invoiceService = invoiceService;
    }

    public Payment getPayment(Long id) {
        return paymentRepository.findById(id).orElseThrow(() -> new PaymentNotFoundException(id));
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public List<Payment> getPaymentsByInvoice(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId);
    }

    @Transactional
    public Payment createPayment(Long invoiceId, Payment payment) {
        Invoice invoice = invoiceService.getInvoice(invoiceId);
        payment.setInvoice(invoice);

        BigDecimal remainingBalance = getRemainingBalance(invoiceId);
        if (payment.getAmount().compareTo(remainingBalance) > 0) {
            throw new IllegalArgumentException("Payment exceeds remaining invoice balance");
        }

        Payment savedPayment = paymentRepository.save(payment);

        updateInvoicePaymentStatus(invoiceId);

        return savedPayment;
    }

    @Transactional
    public Payment updatePayment(Long id, Payment updatedPayment) {
        Payment existingPayment = getPayment(id);

        BigDecimal currentBalance = getRemainingBalance(existingPayment.getInvoice().getId());
        BigDecimal availableBalance = currentBalance.add(existingPayment.getAmount());

        if (updatedPayment.getAmount().compareTo(availableBalance) > 0) {
            throw new IllegalArgumentException("Payment exceeds remaining invoice balance");
        }

        existingPayment.setAmount(updatedPayment.getAmount());
        existingPayment.setPaymentDate(updatedPayment.getPaymentDate());
        existingPayment.setPaymentMethod(updatedPayment.getPaymentMethod());

        Long invoiceId = existingPayment.getInvoice().getId();

        Payment savedPayment = paymentRepository.save(existingPayment);

        updateInvoicePaymentStatus(invoiceId);

        return savedPayment;
    }

    @Transactional
    public void deletePayment(Long id) {
        Payment payment = getPayment(id);
        Long  invoiceId = payment.getInvoice().getId();

        paymentRepository.deleteById(id);

        updateInvoicePaymentStatus(invoiceId);
    }

    public BigDecimal getTotalPaidForInvoice(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId).stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getRemainingBalance(Long invoiceId) {
        Invoice invoice = invoiceService.getInvoice(invoiceId);
        BigDecimal totalPaid = getTotalPaidForInvoice(invoiceId);
        return invoice.getAmount().subtract(totalPaid);
    }

    private void updateInvoicePaymentStatus(Long invoiceId) {
        BigDecimal remainingBalance = getRemainingBalance(invoiceId);

        if (remainingBalance.compareTo(BigDecimal.ZERO) <= 0) {
            invoiceService.markInvoicePaid(invoiceId);
        } else {
            invoiceService.markInvoiceSent(invoiceId);
        }
    }
}
