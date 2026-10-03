package com.adamaleweidat.handymanager.job;

import com.adamaleweidat.handymanager.customer.CustomerService;
import com.adamaleweidat.handymanager.invoice.InvoiceRepository;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class JobServiceTest {
    private final JobRepository jobs = mock(JobRepository.class);
    private final InvoiceRepository invoices = mock(InvoiceRepository.class);
    private final JobService service = new JobService(jobs, mock(CustomerService.class), invoices);

    @Test void rejectsDeletionWhenInvoicesBelongToJob() {
        when(jobs.findById(42L)).thenReturn(Optional.of(new Job()));
        when(invoices.existsByJobId(42L)).thenReturn(true);
        assertThrows(IllegalStateException.class, () -> service.deleteJob(42L));
        verify(jobs, never()).deleteById(anyLong());
    }

    @Test void unrelatedInvoiceWithSameIdDoesNotBlockDeletion() {
        when(jobs.findById(42L)).thenReturn(Optional.of(new Job()));
        when(invoices.existsById(42L)).thenReturn(true);
        when(invoices.existsByJobId(42L)).thenReturn(false);
        service.deleteJob(42L);
        verify(jobs).deleteById(42L);
    }

    @Test void missingJobIsNotDeleted() {
        when(jobs.findById(42L)).thenReturn(Optional.empty());
        assertThrows(JobNotFoundException.class, () -> service.deleteJob(42L));
        verify(jobs, never()).deleteById(anyLong());
        verifyNoInteractions(invoices);
    }
}
