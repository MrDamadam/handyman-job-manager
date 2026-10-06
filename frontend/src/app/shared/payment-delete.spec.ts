import { of, throwError } from 'rxjs';
import { App } from '../app';
import { CustomerFacade } from '../facades/customer.facade';
import { JobService } from '../services/job.service';
import { InvoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { Payment } from '../models/payment';

describe('payment deletion feedback', () => {
  const payment: Payment = { id: 5, invoiceId: 1, amount: 40, paymentMethod: 'CASH', paymentDate: '2026-01-01' };

  it('shows a rejected deletion without removing the displayed payment', () => {
    const app = new App({} as CustomerFacade, {} as JobService, {} as InvoiceService, {
      deletePayment: () => throwError(() => ({ error: { error: 'Cannot delete payment' } })),
    } as unknown as PaymentService);
    app.payments.set([payment]);
    app.deletePayment(payment);
    expect(app.payments()).toEqual([payment]);
    expect(app.paymentError()).toBe('Cannot delete payment');
  });

  it('distinguishes a successful deletion from a failed invoice refresh', () => {
    const app = new App({} as CustomerFacade, {} as JobService, {
      getInvoice: () => throwError(() => ({ status: 0 })),
    } as unknown as InvoiceService, {
      deletePayment: () => of(undefined),
    } as unknown as PaymentService);
    app.payments.set([payment]);
    app.deletePayment(payment);
    expect(app.payments()).toEqual([]);
    expect(app.paymentError()).toContain('Payment deleted');
    expect(app.paymentError()).toContain('Reload');
  });
});
