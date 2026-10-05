package com.adamaleweidat.handymanager.job;

import com.adamaleweidat.handymanager.customer.Customer;
import com.adamaleweidat.handymanager.customer.CustomerService;
import com.adamaleweidat.handymanager.invoice.Invoice;
import com.adamaleweidat.handymanager.invoice.InvoiceRepository;
import com.adamaleweidat.handymanager.invoice.InvoiceService;
import com.adamaleweidat.handymanager.invoice.InvoiceStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final CustomerService customerService;
    private final InvoiceRepository invoiceRepository;

    public JobService(JobRepository jobRepository, CustomerService customerService, InvoiceRepository invoiceRepository) {
        this.jobRepository = jobRepository;
        this.customerService = customerService;
        this.invoiceRepository = invoiceRepository;
    }

    public Job getJob(Long id) {
        return jobRepository.findById(id).orElseThrow(() -> new JobNotFoundException(id));
    }

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public List<Job> getJobsByCustomer(Long customerId) {
        return jobRepository.findByCustomerId(customerId);
    }

    public Job createJob(Long customerId, Job job) {
        Customer customer = customerService.getCustomer(customerId);
        job.setCustomer(customer);
        return jobRepository.save(job);
    }

    @Transactional
    public Job updateJob(Long id, Job updatedJob) {
        Job existingJob = getJob(id);
        existingJob.setTitle(updatedJob.getTitle());
        existingJob.setDescription(updatedJob.getDescription());
        existingJob.setEstimatedAmount(updatedJob.getEstimatedAmount());
        existingJob.setStatus(updatedJob.getStatus());
        Job savedJob = jobRepository.save(existingJob);
        List<Invoice> draftInvoices = invoiceRepository.findByJobIdAndStatus(savedJob.getId(), InvoiceStatus.DRAFT);
        draftInvoices.forEach(invoice -> invoice.setAmount(savedJob.getEstimatedAmount()));
        invoiceRepository.saveAll(draftInvoices);
        return savedJob;
    }

    public void deleteJob(Long id) {
        getJob(id);

        if (invoiceRepository.existsByJobId(id)) {
            throw new IllegalStateException("Job cannot be deleted because it has invoices");
        }

        jobRepository.deleteById(id);
    }
}
