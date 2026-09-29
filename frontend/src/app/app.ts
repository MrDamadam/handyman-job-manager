import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Customer } from './models/customer';
import { CustomerService } from './services/customer.service';
import { FormsModule } from '@angular/forms';
import { Job } from './models/job';
import { JobService } from './services/job.service';

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
  ) {}

  public customers = signal<Customer[]>([]);
  public jobs = signal<Job[]>([]);
  public jobError = signal<string | null>(null);

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

  ngOnInit(): void {
    this.customerService.getCustomers().subscribe((customers) => {
      this.customers.set(customers);
    });
    this.jobService.getJobs().subscribe((jobs) => {
      this.jobs.set(jobs);
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
        this.jobs.update(jobs => jobs.filter(job => job.id !== id));
        },
      error: error => {
        this.jobError.set(error.error?.error ?? 'Unable to delete job');
        }
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
    this.jobService.updateJob(this.editingJob).subscribe(updatedJob => {
      this.jobs.update(jobs => jobs.map(job => job.id === updatedJob.id ? updatedJob : job));
      this.editingJob = null;
    });
  }
}
