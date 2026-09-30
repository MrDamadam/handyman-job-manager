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

@Component({
  imports: [RouterOutlet, FormsModule],
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

  newCustomer = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  };

  newJob = {
    title: '',
    description: '',
    estimatedAmount: 0,
    status: 'ESTIMATE' as const,
    customerId: 0,
  };

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

  createCustomer(): void {
    this.customerService.createCustomer(this.newCustomer).subscribe((customer) => {
      this.customers.update((customers) => [...customers, customer]);
      this.newCustomer = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      };
    });
  }

  editingCustomer: Customer | null = null;

  startEdit(customer: Customer): void {
    this.editingCustomer = { ...customer };
  }

  cancelEdit(): void {
    this.editingCustomer = null;
  }

  saveCustomer(): void {
    if (!this.editingCustomer) {
      return;
    }
    this.customerService.updateCustomer(this.editingCustomer).subscribe((updatedCustomer) => {
      this.customers.update((customers) =>
        customers.map((customer) =>
          customer.id === updatedCustomer.id ? updatedCustomer : customer,
        ),
      );
      this.editingCustomer = null;
    });
  }

  createJob(): void {
    const customerId = this.newJob.customerId;
    this.jobService.createJob(customerId, this.newJob).subscribe((job) => {
      this.jobs.update((jobs) => [...jobs, job]);
      this.newJob = {
        title: '',
        description: '',
        estimatedAmount: 0,
        status: 'ESTIMATE',
        customerId: 0,
      };
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

  editingJob: Job | null = null;

  startEditJob(job: Job): void {
    this.editingJob = { ...job };
    this.jobError.set(null);
  }

  cancelEditJob(): void {
    this.editingJob = null;
  }

  saveJob(): void {
    if (!this.editingJob) {
      return;
    }
    this.jobService.updateJob(this.editingJob).subscribe((updatedJob) => {
      this.jobs.update((jobs) => jobs.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
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
      this.editingJob = null;
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
