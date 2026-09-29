package com.adamaleweidat.handymanager.invoice;

import com.adamaleweidat.handymanager.job.Job;
import com.adamaleweidat.handymanager.job.JobService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final JobService jobService;

    public InvoiceService(InvoiceRepository invoiceRepository, JobService jobService) {
        this.invoiceRepository = invoiceRepository;
        this.jobService = jobService;
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
        Job job = jobService.getJob(jobId);
        invoice.setJob(job);
        return invoiceRepository.save(invoice);
    }

    public Invoice updateInvoice(Long id, Invoice updatedInvoice) {
        Invoice existingInvoice = getInvoice(id);

        existingInvoice.setAmount(updatedInvoice.getAmount());
        existingInvoice.setStatus(updatedInvoice.getStatus());
        existingInvoice.setPaidDate(updatedInvoice.getPaidDate());

        return invoiceRepository.save(existingInvoice);
    }

    public void deleteInvoice(Long id) {
        getInvoice(id);
        invoiceRepository.deleteById(id);
    }

    public Invoice markInvoiceSent(Long id) {
        Invoice invoice = getInvoice(id);

        invoice.setStatus(InvoiceStatus.SENT);
        invoice.setPaidDate(null);

        return  invoiceRepository.save(invoice);
    }
    public Invoice markInvoicePaid(Long id) {
        Invoice invoice = getInvoice(id);

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidDate(LocalDateTime.now());

        return invoiceRepository.save(invoice);
    }
}
