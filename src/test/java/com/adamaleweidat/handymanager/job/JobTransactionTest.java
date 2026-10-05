package com.adamaleweidat.handymanager.job;

import com.adamaleweidat.handymanager.customer.Customer;
import com.adamaleweidat.handymanager.customer.CustomerRepository;
import com.adamaleweidat.handymanager.customer.CustomerService;
import com.adamaleweidat.handymanager.invoice.Invoice;
import com.adamaleweidat.handymanager.invoice.InvoiceRepository;
import com.adamaleweidat.handymanager.invoice.InvoiceStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

@DataJpaTest
@AutoConfigureTestDatabase(
        replace = AutoConfigureTestDatabase.Replace.ANY
)
@Import({JobService.class, CustomerService.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class JobTransactionTest {

    @Autowired
    private JobService jobService;

    @Autowired
    private JobRepository jobs;

    @Autowired
    private CustomerRepository customers;

    @MockitoSpyBean
    private InvoiceRepository invoices;

    private Long jobId;
    private Long draftInvoiceId;
    private Long sentInvoiceId;

    @BeforeEach
    void setup() {
        Customer customer = customers.save(
                new Customer("Alex", "Smith", "alex@example.com", "")
        );

        Job job = jobs.save(new Job(
                "Original title",
                "Original description",
                new BigDecimal("100.00"),
                JobStatus.ESTIMATE,
                customer
        ));
        jobId = job.getId();

        draftInvoiceId = invoices.save(new Invoice(
                new BigDecimal("100.00"), InvoiceStatus.DRAFT, job
        )).getId();

        sentInvoiceId = invoices.save(new Invoice(
                new BigDecimal("100.00"), InvoiceStatus.SENT, job
        )).getId();
    }

    private Job updatedJob() {
        Job update = new Job();
        update.setTitle("Updated title");
        update.setDescription("Updated description");
        update.setEstimatedAmount(new BigDecimal("250.00"));
        update.setStatus(JobStatus.SCHEDULED);
        return update;
    }

    @Test
    void commitsJobAndDraftInvoiceTogether() {
        jobService.updateJob(jobId, updatedJob());

        Job saved = jobs.findById(jobId).orElseThrow();
        assertEquals("Updated title", saved.getTitle());
        assertEquals(JobStatus.SCHEDULED, saved.getStatus());
        assertAmount("250.00", saved.getEstimatedAmount());
        assertAmount("250.00", invoiceAmount(draftInvoiceId));
        assertAmount("100.00", invoiceAmount(sentInvoiceId));
    }

    @Test
    void rollsBackJobAndInvoiceWhenInvoiceUpdateFails() {
        doAnswer(invocation -> {
            // Send pending changes to the database, without committing.
            invoices.flush();
            throw new IllegalStateException("Simulated invoice failure");
        }).when(invoices).saveAll(any());

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> jobService.updateJob(jobId, updatedJob())
        );
        assertEquals("Simulated invoice failure", error.getMessage());

        Job saved = jobs.findById(jobId).orElseThrow();
        assertEquals("Original title", saved.getTitle());
        assertEquals(JobStatus.ESTIMATE, saved.getStatus());
        assertAmount("100.00", saved.getEstimatedAmount());
        assertAmount("100.00", invoiceAmount(draftInvoiceId));
        assertAmount("100.00", invoiceAmount(sentInvoiceId));
    }

    private BigDecimal invoiceAmount(Long id) {
        return invoices.findById(id).orElseThrow().getAmount();
    }

    private void assertAmount(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual));
    }
}
