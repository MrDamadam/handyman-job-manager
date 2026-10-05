package com.adamaleweidat.handymanager.customer;

import com.adamaleweidat.handymanager.job.JobRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final JobRepository jobRepository;

    public CustomerService(CustomerRepository customerRepository, JobRepository jobRepository) {
        this.customerRepository = customerRepository;
        this.jobRepository = jobRepository;
    }

    public Customer createCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    public Customer getCustomer(Long id) {
        return customerRepository.findById(id).orElseThrow(() -> new CustomerNotFoundException(id));
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Customer updateCustomer(Long id, Customer updatedCustomer) {
        Customer existingCustomer = getCustomer(id);
        existingCustomer.setFirstName(updatedCustomer.getFirstName());
        existingCustomer.setLastName(updatedCustomer.getLastName());
        existingCustomer.setEmail(updatedCustomer.getEmail());
        existingCustomer.setPhone(updatedCustomer.getPhone());
        return customerRepository.save(existingCustomer);
    }

    public void deleteCustomer(Long id) {
        getCustomer(id);
        if (jobRepository.existsByCustomerId(id)) {
            throw new IllegalStateException("Customer cannot be deleted because they have jobs");
        }
        customerRepository.deleteById(id);
    }
}
