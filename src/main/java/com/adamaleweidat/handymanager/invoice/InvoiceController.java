package com.adamaleweidat.handymanager.invoice;

import com.adamaleweidat.handymanager.dto.InvoiceResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping("/{id}")
    public InvoiceResponse getInvoice(@PathVariable Long id) {
        return new InvoiceResponse(invoiceService.getInvoice(id));
    }

    @GetMapping
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceService.getAllInvoices().stream().map(InvoiceResponse::new).toList();
    }

    @GetMapping("/job/{jobId}")
    public List<InvoiceResponse> getInvoicesByJob(@PathVariable Long jobId) {
        return invoiceService.getInvoicesByJob(jobId).stream().map(InvoiceResponse::new).toList();
    }

    @PostMapping("/job/{jobId}")
    public ResponseEntity<InvoiceResponse> createInvoice(@PathVariable Long jobId, @Valid @RequestBody Invoice invoice) {

        Invoice savedInvoice = invoiceService.createInvoice(jobId, invoice);

        return ResponseEntity.status(HttpStatus.CREATED).body(new InvoiceResponse(savedInvoice));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvoiceResponse> updateInvoice(@PathVariable Long id, @Valid @RequestBody Invoice invoice) {

        Invoice savedInvoice = invoiceService.updateInvoice(id, invoice);
        return ResponseEntity.ok(new InvoiceResponse(savedInvoice));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }
}
