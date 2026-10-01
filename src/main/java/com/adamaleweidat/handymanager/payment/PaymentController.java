package com.adamaleweidat.handymanager.payment;

import com.adamaleweidat.handymanager.dto.PaymentResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/{id}")
    public PaymentResponse getPayment(@PathVariable Long id) {
        return new PaymentResponse(paymentService.getPayment(id));
    }

    @GetMapping
    public List<PaymentResponse> getAllPayments() {
        return paymentService.getAllPayments().stream().map(PaymentResponse::new).toList();
    }

    @GetMapping("/invoice/{invoiceId}")
    public List<PaymentResponse> getPaymentsByInvoice(@PathVariable Long invoiceId) {
        return paymentService.getPaymentsByInvoice(invoiceId).stream().map(PaymentResponse::new).toList();
    }

    @PostMapping("/invoice/{invoiceId}")
    public ResponseEntity<PaymentResponse> createPayment(@PathVariable Long invoiceId, @Valid @RequestBody Payment payment) {
        Payment savedPayment = paymentService.createPayment(invoiceId, payment);
        return ResponseEntity.status(HttpStatus.CREATED).body(new PaymentResponse(savedPayment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentResponse> updatePayment(@PathVariable Long id, @Valid @RequestBody Payment payment) {
        Payment savedPayment = paymentService.updatePayment(id, payment);
        return ResponseEntity.ok(new PaymentResponse(savedPayment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>  deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invoice/{invoiceId}/balance")
    public BigDecimal getRemainingBalance(@PathVariable Long invoiceId) {
        return paymentService.getRemainingBalance(invoiceId);
    }
}
