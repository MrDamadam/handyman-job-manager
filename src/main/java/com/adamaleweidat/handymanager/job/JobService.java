package com.adamaleweidat.handymanager.job;

import com.adamaleweidat.handymanager.customer.Customer;
import com.adamaleweidat.handymanager.customer.CustomerService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final CustomerService customerService;

    public JobService(JobRepository jobRepository, CustomerService customerService) {
        this.jobRepository = jobRepository;
        this.customerService = customerService;
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

    public Job updateJob(Long id, Job updatedJob) {
        Job existingJob = getJob(id);
        existingJob.setTitle(updatedJob.getTitle());
        existingJob.setDescription(updatedJob.getDescription());
        existingJob.setEstimatedAmount(updatedJob.getEstimatedAmount());
        existingJob.setStatus(updatedJob.getStatus());
        return jobRepository.save(existingJob);
    }

    public void deleteJob(Long id) {
        getJob(id);
        jobRepository.deleteById(id);
    }
}
