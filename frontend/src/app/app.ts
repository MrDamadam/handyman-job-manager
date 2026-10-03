import { Component, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Customer } from './models/customer';
import { CustomerService } from './services/customer.service';
import { Customers } from './components/customers/customers';

import { Job } from './models/job';
import { JobService } from './services/job.service';
import { Jobs } from './components/jobs/jobs';

import { Invoice } from './models/invoice';
import { InvoiceService } from './services/invoice.service';
import { Invoices } from './components/invoices/invoices';

import { Payment } from './models/payment';
import { PaymentService } from './services/payment.service';

@Component({
  imports: [FormsModule, Customers, Jobs, Invoices],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  public customers = signal<Customer[]>([]);
  public jobs = signal<Job[]>([]);
  public jobError = signal<string | null>(null);
  public invoices = signal<Invoice[]>([]);
  public invoiceError = signal<string | null>(null);
  public payments = signal<Payment[]>([]);

  constructor(
    private customerService: CustomerService,
    private jobService: JobService,
    private invoiceService: InvoiceService,
    private paymentService: PaymentService,
  ) {}

  newPayment = {
    invoiceId: 0,
    amount: 0,
    paymentMethod: 'CASH' as const,
  };

  ngOnInit(): void {
    this.customerService.getCustomers().subscribe((customers) => {
      this.customers.set(customers);
    });
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

  createCustomerFromForm(customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }): void {
    this.customerService.createCustomer(customer).subscribe((createdCustomer) => {
      this.customers.update((customers) => [...customers, createdCustomer]);
    });
  }

  saveCustomer(customer: Customer): void {
    this.customerService.updateCustomer(customer).subscribe((updatedCustomer) => {
      this.customers.update((customers) =>
        customers.map((existingCustomer) =>
          existingCustomer.id === updatedCustomer.id ? updatedCustomer : existingCustomer,
        ),
      );
      this.jobs.update((jobs) =>
        jobs.map((job) =>
          job.customerId === updatedCustomer.id
            ? {
                ...job,
                customerFirstName: updatedCustomer.firstName,
                customerLastName: updatedCustomer.lastName,
              }
            : job,
        ),
      );
    });
  }

  deleteCustomer(id: number): void {
    this.customerService.deleteCustomer(id).subscribe(() => {
      this.customers.update((customers) => customers.filter((customer) => customer.id !== id));
    });
  }

  createJobFromForm(job: {
    title: string;
    description: string;
    estimatedAmount: number;
    status: 'ESTIMATE';
    customerId: number;
  }): void {
    const customerId = job.customerId;
    this.jobService.createJob(customerId, job).subscribe((createdJob) => {
      this.jobs.update((jobs) => [...jobs, createdJob]);
    });
  }

  saveJob(job: Job): void {
    this.jobService.updateJob(job).subscribe((updatedJob) => {
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

  createInvoiceFromForm(invoice: { jobId: number; amount: number; status: 'DRAFT' }): void {
    const jobId = invoice.jobId;

    this.invoiceService.createInvoice(jobId, invoice).subscribe((createdInvoice) => {
      this.invoices.update((invoices) => [...invoices, createdInvoice]);
    });
  }

  saveInvoice(invoice: Invoice): void {
    this.invoiceService.updateInvoice(invoice).subscribe((updatedInvoice) => {
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

  createPayment(): void {
    const invoiceId = this.newPayment.invoiceId;
    this.paymentService.createPayment(invoiceId, this.newPayment).subscribe((payment) => {
      this.payments.update((payments) => [...payments, payment]);
      this.invoiceService.getInvoice(payment.invoiceId).subscribe((updatedInvoice) => {
        this.invoices.update((invoices) =>
          invoices.map((invoice) => (invoice.id === updatedInvoice.id ? updatedInvoice : invoice)),
        );
      });
      this.newPayment = {
        invoiceId: 0,
        amount: 0,
        paymentMethod: 'CASH',
      };
    });
  }

  deletePayment(payment: Payment): void {
    const invoiceId = payment.invoiceId;
    this.paymentService.deletePayment(payment.id).subscribe(() => {
      this.payments.update((payments) =>
        payments.filter((existingPayment) => existingPayment.id !== payment.id),
      );
      this.invoiceService.getInvoice(invoiceId).subscribe((updatedInvoice) => {
        this.invoices.update((invoices) =>
          invoices.map((invoice) => (invoice.id === updatedInvoice.id ? updatedInvoice : invoice)),
        );
      });
    });
  }
}
