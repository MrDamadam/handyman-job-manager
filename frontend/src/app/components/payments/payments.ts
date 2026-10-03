import { SaveRequest, SaveState } from '../../shared/save-state';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Invoice } from '../../models/invoice';
import { Payment } from '../../models/payment';

@Component({
  selector: 'app-payments',
  imports: [FormsModule],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class Payments {
  readonly createState = new SaveState();
  readonly editState = new SaveState();

  invoices = input.required<Invoice[]>();
  payments = input.required<Payment[]>();

  paymentError = input<string | null>(null);

  newPayment = {
    invoiceId: 0,
    amount: 0,
    paymentMethod: 'CASH' as const,
  };

  submitNewPayment(): void {
    this.createState.submit({ ...this.newPayment }, this.createPayment, () => {
    this.newPayment = {
      invoiceId: 0,
      amount: 0,
      paymentMethod: 'CASH',
    };
    });
  }

  createPayment = output<SaveRequest<typeof this.newPayment>>();

  deletePayment = output<Payment>();
}
