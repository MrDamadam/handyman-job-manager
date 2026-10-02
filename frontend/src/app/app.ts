import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Customer } from './models/customer';
import { CustomerService } from './services/customer.service';
import { FormsModule } from '@angular/forms';
import { Job } from './models/job';
import { JobService } from './services/job.service';
import { Invoice } from './models/invoice';
import { InvoiceService } from './services/invoice.service';
import { Payment } from './models/payment';
import { PaymentService } from './services/payment.service';
import { Customers } from './components/customers/customers';
import { Jobs } from './components/jobs/jobs';

@Component({
  imports: [RouterOutlet, FormsModule, Customers, Jobs],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  constructor(
    private customerService: CustomerService,
    private jobService: JobService,
    private invoiceService: InvoiceService,
    private paymentService: PaymentService,
  ) {}

  public customers = signal<Customer[]>([]);
  public jobs = signal<Job[]>([]);
  public jobError = signal<string | null>(null);
  public invoices = signal<Invoice[]>([]);
  public invoiceError = signal<string | null>(null);
  public payments = signal<Payment[]>([]);

  newInvoice = {
    jobId: 0,
    amount: 0,
    status: 'DRAFT' as const,
  };

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

  deleteCustomer(id: number): void {
    this.customerService.deleteCustomer(id).subscribe(() => {
      this.customers.update((customers) => customers.filter((customer) => customer.id !== id));
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

  createInvoice(): void {
    const jobId = this.newInvoice.jobId;
    this.invoiceService.createInvoice(jobId, this.newInvoice).subscribe((invoice) => {
      this.invoices.update((invoices) => [...invoices, invoice]);
      this.newInvoice = {
        jobId: 0,
        amount: 0,
        status: 'DRAFT',
      };
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

  editingInvoice: Invoice | null = null;

  startEditInvoice(invoice: Invoice): void {
    this.editingInvoice = { ...invoice };
    this.invoiceError.set(null);
  }

  cancelEditInvoice(): void {
    this.editingInvoice = null;
  }

  saveInvoice(): void {
    if (!this.editingInvoice) {
      return;
    }
    this.invoiceService.updateInvoice(this.editingInvoice).subscribe((updatedInvoice) => {
      this.invoices.update((invoices) =>
        invoices.map((invoice) => (invoice.id === updatedInvoice.id ? updatedInvoice : invoice)),
      );
      this.editingInvoice = null;
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

  getRemainingBalance(invoice: Invoice): number {
    const paid = this.payments()
      .filter((payment) => payment.invoiceId === invoice.id)
      .reduce((total, payment) => total + payment.amount, 0);
    return invoice.amount - paid;
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
