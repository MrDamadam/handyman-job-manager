import { SaveRequest, settleSave } from './shared/save-state';
import { Component, OnInit, computed, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { CustomerFacade } from './facades/customer.facade';
import { Customers } from './components/customers/customers';

import { Job } from './models/job';
import { JobService } from './services/job.service';
import { Jobs } from './components/jobs/jobs';

import { Invoice } from './models/invoice';
import { InvoiceService } from './services/invoice.service';
import { Invoices } from './components/invoices/invoices';

import { Payment } from './models/payment';
import { PaymentService } from './services/payment.service';
import { Payments } from './components/payments/payments';

@Component({
  imports: [FormsModule, Customers, Jobs, Invoices, Payments],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  public jobs = signal<Job[]>([]);
  public invoices = signal<Invoice[]>([]);
  public payments = signal<Payment[]>([]);

  public customerError = signal<string | null>(null);
  public jobError = signal<string | null>(null);
  public invoiceError = signal<string | null>(null);
  public paymentError = signal<string | null>(null);

  readonly jobsForDisplay = computed(() => {
    const customersById = new Map(
      this.customerFacade.customers().map((customer) => [customer.id, customer]),
    );
    return this.jobs().map((job) => {
      const customer = customersById.get(job.customerId);
      return customer
        ? {
            ...job,
            customerFirstName: customer.firstName,
            customerLastName: customer.lastName,
          }
        : job;
    });
  });

  constructor(
    public readonly customerFacade: CustomerFacade,
    private jobService: JobService,
    private invoiceService: InvoiceService,
    private paymentService: PaymentService,
  ) {}

  ngOnInit(): void {
    this.customerFacade.load();
    this.jobService.getJobs().subscribe((jobs) => {
      this.jobs.set(jobs);
    });
    this.invoiceService.getInvoices().subscribe((invoices) => {
      this.invoices.set(invoices);
    });
    this.paymentService.getPayments().subscribe((payments) => {
      this.payments.set(payments);
    });
  }

  createJobFromForm(
    request: SaveRequest<{
      title: string;
      description: string;
      estimatedAmount: number;
      status: 'ESTIMATE';
      customerId: number;
    }>,
  ): void {
    const job = request.value;
    const customerId = job.customerId;
    this.jobService
      .createJob(customerId, job)
      .pipe(settleSave(request))
      .subscribe((createdJob) => {
        this.jobs.update((jobs) => [...jobs, createdJob]);
      });
  }

  saveJob(request: SaveRequest<Job>): void {
    const job = request.value;
    this.jobService
      .updateJob(job)
      .pipe(settleSave(request))
      .subscribe((updatedJob) => {
        this.jobs.update((jobs) =>
          jobs.map((existingJob) => (existingJob.id === updatedJob.id ? updatedJob : existingJob)),
        );
        this.invoices.update((invoices) =>
          invoices.map((invoice) => {
            if (invoice.jobId !== updatedJob.id) {
              return invoice;
            }
            return {
              ...invoice,
              jobTitle: updatedJob.title,
              amount: invoice.status === 'DRAFT' ? updatedJob.estimatedAmount : invoice.amount,
            };
          }),
        );
      });
  }

  deleteJob(id: number): void {
    this.jobError.set(null);
    this.jobService.deleteJob(id).subscribe({
      next: () => {
        this.jobs.update((jobs) => jobs.filter((job) => job.id !== id));
      },
      error: (error) => {
        this.jobError.set(error.error?.error ?? 'Unable to delete job');
      },
    });
  }

  createInvoiceFromForm(
    request: SaveRequest<{ jobId: number; amount: number; status: 'DRAFT' }>,
  ): void {
    const invoice = request.value;
    const jobId = invoice.jobId;

    this.invoiceService
      .createInvoice(jobId, invoice)
      .pipe(settleSave(request))
      .subscribe((createdInvoice) => {
        this.invoices.update((invoices) => [...invoices, createdInvoice]);
      });
  }

  saveInvoice(request: SaveRequest<Invoice>): void {
    const invoice = request.value;
    this.invoiceService
      .updateInvoice(invoice)
      .pipe(settleSave(request))
      .subscribe((updatedInvoice) => {
        this.invoices.update((invoices) =>
          invoices.map((existingInvoice) =>
            existingInvoice.id === updatedInvoice.id ? updatedInvoice : existingInvoice,
          ),
        );
      });
  }

  deleteInvoice(id: number): void {
    this.invoiceError.set(null);
    this.invoiceService.deleteInvoice(id).subscribe({
      next: () => {
        this.invoices.update((invoices) => invoices.filter((invoice) => invoice.id !== id));
      },
      error: (error) => {
        this.invoiceError.set(error.error?.error ?? 'Unable to delete invoice');
      },
    });
  }

  createPaymentFromForm(
    request: SaveRequest<{
      invoiceId: number;
      amount: number;
      paymentMethod: 'CASH';
    }>,
  ): void {
    const payment = request.value;
    this.paymentError.set(null);
    const invoiceId = payment.invoiceId;
    this.paymentService
      .createPayment(invoiceId, payment)
      .pipe(settleSave(request))
      .subscribe((createdPayment) => {
        this.payments.update((payments) => [...payments, createdPayment]);
        this.invoiceService.getInvoice(createdPayment.invoiceId).subscribe({
          next: (updatedInvoice) => {
            this.invoices.update((invoices) =>
              invoices.map((invoice) =>
                invoice.id === updatedInvoice.id ? updatedInvoice : invoice,
              ),
            );
          },
          error: () =>
            this.paymentError.set(
              'Payment saved, but invoice details could not refresh. Reload the page; do not submit the payment again.',
            ),
        });
      });
  }

  deletePayment(payment: Payment): void {
    this.paymentError.set(null);
    const invoiceId = payment.invoiceId;
    this.paymentService.deletePayment(payment.id).subscribe({
      next: () => {
        this.payments.update((payments) =>
          payments.filter((existingPayment) => existingPayment.id !== payment.id),
        );
        this.invoiceService.getInvoice(invoiceId).subscribe({
          next: (updatedInvoice) => {
            this.invoices.update((invoices) =>
              invoices.map((invoice) =>
                invoice.id === updatedInvoice.id ? updatedInvoice : invoice,
              ),
            );
          },
          error: () =>
            this.paymentError.set(
              'Payment deleted, but invoice details could not refresh. Reload the page.',
            ),
        });
      },
      error: (error) =>
        this.paymentError.set(error.error?.error ?? 'Unable to delete payment. Please try again.'),
    });
  }
}
