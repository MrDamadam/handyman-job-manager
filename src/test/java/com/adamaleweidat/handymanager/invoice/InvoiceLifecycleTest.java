package com.adamaleweidat.handymanager.invoice;

import com.adamaleweidat.handymanager.job.Job;
import com.adamaleweidat.handymanager.job.JobService;
import com.adamaleweidat.handymanager.payment.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class InvoiceLifecycleTest {
    private final InvoiceRepository invoices = mock(InvoiceRepository.class);
    private final PaymentRepository payments = mock(PaymentRepository.class);
    private final JobService jobs = mock(JobService.class);
    private final InvoiceService invoiceService = new InvoiceService(invoices, jobs, payments);
    private final PaymentService paymentService = new PaymentService(payments, invoiceService);
    private final List<Payment> recorded = new ArrayList<>();
    private Invoice invoice;

    @BeforeEach void setup() {
        invoice = new Invoice(new BigDecimal("100.00"), InvoiceStatus.SENT, new Job());
        ReflectionTestUtils.setField(invoice, "id", 1L);
        when(invoices.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoices.save(any(Invoice.class))).thenAnswer(call -> call.getArgument(0));
        when(payments.existsByInvoiceId(1L)).thenAnswer(call -> !recorded.isEmpty());
        when(payments.findByInvoiceId(1L)).thenAnswer(call -> new ArrayList<>(recorded));
        when(payments.save(any(Payment.class))).thenAnswer(call -> {
            Payment payment = call.getArgument(0);
            if (!recorded.contains(payment)) recorded.add(payment);
            return payment;
        });
        doAnswer(call -> { recorded.remove(call.getArgument(0)); return null; })
            .when(payments).delete(any(Payment.class));
    }

    private Payment payment(String amount) {
        return new Payment(new BigDecimal(amount), LocalDateTime.now(), PaymentMethod.CASH, invoice);
    }

    private Payment existingPayment(String amount) {
        Payment payment = payment(amount);
        recorded.add(payment);
        when(payments.findById(5L)).thenReturn(Optional.of(payment));
        return payment;
    }

    @ParameterizedTest
    @EnumSource(value = InvoiceStatus.class, names = {"PAID", "CANCELLED"})
    @NullSource
    void rejectsInvalidCreationStatus(InvoiceStatus status) {
        Invoice request = new Invoice(BigDecimal.TEN, status, null);
        assertThrows(IllegalArgumentException.class, () -> invoiceService.createInvoice(2L, request));
        verify(invoices, never()).save(any());
        verifyNoInteractions(jobs);
    }

    @ParameterizedTest
    @EnumSource(value = InvoiceStatus.class, names = {"DRAFT", "SENT"})
    void permitsValidCreationAndClearsSuppliedPaidDate(InvoiceStatus status) {
        Job job = new Job();
        when(jobs.getJob(2L)).thenReturn(job);
        Invoice request = new Invoice(BigDecimal.TEN, status, null);
        request.setPaidDate(LocalDateTime.now());
        Invoice saved = invoiceService.createInvoice(2L, request);
        assertEquals(status, saved.getStatus());
        assertSame(job, saved.getJob());
        assertNull(saved.getPaidDate());
    }

    @Test void rejectsCancellingPartiallyPaidInvoice() {
        existingPayment("40.00");
        Invoice update = new Invoice();
        update.setStatus(InvoiceStatus.CANCELLED);
        assertThrows(IllegalStateException.class, () -> invoiceService.updateInvoice(1L, update));
        assertEquals(InvoiceStatus.SENT, invoice.getStatus());
        verify(invoices, never()).save(any());
    }

    @ParameterizedTest
    @EnumSource(value = InvoiceStatus.class, names = {"DRAFT", "SENT"})
    void allowsCancellingInvoiceWithoutPayments(InvoiceStatus status) {
        invoice.setStatus(status);
        Invoice update = new Invoice();
        update.setStatus(InvoiceStatus.CANCELLED);
        assertEquals(InvoiceStatus.CANCELLED, invoiceService.updateInvoice(1L, update).getStatus());
    }

    @Test void deletingLegacyPaymentDoesNotReopenCancelledInvoice() {
        existingPayment("40.00");
        invoice.setStatus(InvoiceStatus.CANCELLED);
        paymentService.deletePayment(5L);
        assertTrue(recorded.isEmpty());
        assertEquals(InvoiceStatus.CANCELLED, invoice.getStatus());
        verify(invoices, never()).save(any());
    }

    @Test void rejectsEditingPaymentOnCancelledInvoiceBeforeMutation() {
        Payment original = existingPayment("40.00");
        invoice.setStatus(InvoiceStatus.CANCELLED);
        assertThrows(IllegalStateException.class, () -> paymentService.updatePayment(5L, payment("20.00")));
        assertEquals(new BigDecimal("40.00"), original.getAmount());
        assertEquals(InvoiceStatus.CANCELLED, invoice.getStatus());
        verify(payments, never()).save(any());
    }

    @ParameterizedTest
    @EnumSource(value = InvoiceStatus.class, names = {"DRAFT", "CANCELLED"})
    void internalStatusHelpersCannotBypassLifecycle(InvoiceStatus status) {
        invoice.setStatus(status);
        assertThrows(IllegalStateException.class, () -> invoiceService.markInvoiceSent(1L));
        assertThrows(IllegalStateException.class, () -> invoiceService.markInvoicePaid(1L));
        assertEquals(status, invoice.getStatus());
    }

    @Test void fullPaymentSettlesAndDeletionRestoresSentStatus() {
        Payment payment = payment("100.00");
        when(payments.findById(5L)).thenReturn(Optional.of(payment));
        paymentService.createPayment(1L, payment);
        assertEquals(InvoiceStatus.PAID, invoice.getStatus());
        assertNotNull(invoice.getPaidDate());
        paymentService.deletePayment(5L);
        assertEquals(InvoiceStatus.SENT, invoice.getStatus());
        assertNull(invoice.getPaidDate());
        assertEquals(new BigDecimal("100.00"), paymentService.getRemainingBalance(1L));
    }

    @Test void partialPaymentLeavesInvoiceSent() {
        paymentService.createPayment(1L, payment("40.00"));
        assertEquals(InvoiceStatus.SENT, invoice.getStatus());
        assertNull(invoice.getPaidDate());
        assertEquals(new BigDecimal("60.00"), paymentService.getRemainingBalance(1L));
    }

    @Test void editingPaymentMetadataPreservesSettlementDate() {
        existingPayment("100.00");
        invoice.setStatus(InvoiceStatus.PAID);
        LocalDateTime settledAt = LocalDateTime.of(2026, 1, 1, 12, 0);
        invoice.setPaidDate(settledAt);
        paymentService.updatePayment(5L, payment("100.00"));
        assertEquals(settledAt, invoice.getPaidDate());
    }

    @Test void rejectsManualPaidTransition() {
        Invoice update = new Invoice();
        update.setStatus(InvoiceStatus.PAID);
        assertThrows(IllegalStateException.class, () -> invoiceService.updateInvoice(1L, update));
        assertEquals(InvoiceStatus.SENT, invoice.getStatus());
    }
}
