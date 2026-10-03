package com.adamaleweidat.handymanager.invoice;

import com.adamaleweidat.handymanager.job.Job;
import com.adamaleweidat.handymanager.job.JobService;
import com.adamaleweidat.handymanager.payment.PaymentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final JobService jobService;
    private final PaymentRepository paymentRepository;

    public InvoiceService(InvoiceRepository invoiceRepository, JobService jobService, PaymentRepository paymentRepository) {
        this.invoiceRepository = invoiceRepository;
        this.jobService = jobService;
        this.paymentRepository = paymentRepository;
    }

    public Invoice getInvoice(Long id) {
        return invoiceRepository.findById(id).orElseThrow(() -> new InvoiceNotFoundException(id));
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public List<Invoice> getInvoicesByJob(Long jobId) {
        return invoiceRepository.findByJobId(jobId);
    }

    public Invoice createInvoice(Long jobId, Invoice invoice) {
        if (invoice.getStatus() != InvoiceStatus.DRAFT && invoice.getStatus() != InvoiceStatus.SENT) {
            throw new IllegalArgumentException("New invoices must be draft or sent; paid status is determined by payments");
        }
        invoice.setPaidDate(null);
        Job job = jobService.getJob(jobId);
        invoice.setJob(job);
        return invoiceRepository.save(invoice);
    }

    public Invoice updateInvoice(Long id, Invoice updatedInvoice) {
        Invoice existingInvoice = getInvoice(id);
        InvoiceStatus currentStatus = existingInvoice.getStatus();
        InvoiceStatus newStatus = updatedInvoice.getStatus();
        if (currentStatus == InvoiceStatus.PAID) {
            throw new IllegalStateException("Paid invoices cannot be modified");
        }
        if (currentStatus == InvoiceStatus.CANCELLED) {
            throw new IllegalStateException("Cancelled invoices cannot be modified");
        }
        if (currentStatus == InvoiceStatus.SENT && newStatus == InvoiceStatus.DRAFT) {
            throw new IllegalStateException("Sent invoices cannot be changed back to draft");
        }
        if (newStatus == InvoiceStatus.PAID) {
            throw new IllegalStateException("Invoices can only be marked paid through payments");
        }
        if (newStatus == null) {
            throw new IllegalArgumentException("Invoice status is required");
        }
        if (newStatus == InvoiceStatus.CANCELLED && paymentRepository.existsByInvoiceId(id)) {
            throw new IllegalStateException("Invoice cannot be cancelled because it has payments");
        }
        existingInvoice.setStatus(newStatus);
        return invoiceRepository.save(existingInvoice);
    }

    public void deleteInvoice(Long id) {
        getInvoice(id);
        if (paymentRepository.existsByInvoiceId(id)) {
            throw new IllegalStateException("Invoice cannot be deleted because it has payments");
        }
        invoiceRepository.deleteById(id);
    }

    public void markInvoiceSent(Long id) {
        Invoice invoice = getInvoice(id);
        requirePaymentStatusChangeAllowed(invoice);
        invoice.setStatus(InvoiceStatus.SENT);
        invoice.setPaidDate(null);
        invoiceRepository.save(invoice);
    }

    public void markInvoicePaid(Long id) {
        Invoice invoice = getInvoice(id);
        requirePaymentStatusChangeAllowed(invoice);
        if (invoice.getStatus() != InvoiceStatus.PAID) {
            invoice.setPaidDate(LocalDateTime.now());
        }
        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);
    }
    private void requirePaymentStatusChangeAllowed(Invoice invoice) {
        if (invoice.getStatus() != InvoiceStatus.SENT && invoice.getStatus() != InvoiceStatus.PAID) {
            throw new IllegalStateException("Payments cannot change the status of draft or cancelled invoices");
        }
    }
}
