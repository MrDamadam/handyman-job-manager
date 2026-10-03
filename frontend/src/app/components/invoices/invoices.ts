import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Job } from '../../models/job';
import { Invoice } from '../../models/invoice';
import { Payment } from '../../models/payment';

@Component({
  selector: 'app-invoices',
  imports: [FormsModule],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css',
})
export class Invoices {
  invoices = input.required<Invoice[]>();
  jobs = input.required<Job[]>();
  payments = input.required<Payment[]>();
  invoiceError = input<string | null>(null);

  newInvoice = {
    jobId: 0,
    amount: 0,
    status: 'DRAFT' as const,
  };

  createInvoice = output<typeof this.newInvoice>();

  submitNewInvoice(): void {
    this.createInvoice.emit(this.newInvoice);
    this.newInvoice = {
      jobId: 0,
      amount: 0,
      status: 'DRAFT',
    };
  }

  editingInvoice: Invoice | null = null;

  startEditInvoice(invoice: Invoice): void {
    this.editingInvoice = { ...invoice };
  }

  cancelEditInvoice(): void {
    this.editingInvoice = null;
  }

  invoiceUpdated = output<Invoice>();

  saveInvoice(): void {
    if (!this.editingInvoice) {
      return;
    }
    this.invoiceUpdated.emit(this.editingInvoice);
    this.editingInvoice = null;
  }

  deleteInvoice = output<number>();

  getRemainingBalance(invoice: Invoice): number {
    const paid = this.payments()
      .filter((payment) => payment.invoiceId === invoice.id)
      .reduce((total, payment) => total + payment.amount, 0);
    return invoice.amount - paid;
  }
}
