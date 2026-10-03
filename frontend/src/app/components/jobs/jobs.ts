import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../models/customer';
import { Job } from '../../models/job';

@Component({
  selector: 'app-jobs',
  imports: [FormsModule],
  templateUrl: './jobs.html',
  styleUrl: './jobs.css',
})
export class Jobs {
  customers = input.required<Customer[]>();
  jobs = input.required<Job[]>();
  jobError = input<string | null>(null);

  newJob = {
    title: '',
    description: '',
    estimatedAmount: 0,
    status: 'ESTIMATE' as const,
    customerId: 0,
  };

  createJob = output<typeof this.newJob>();

  submitNewJob(): void {
    this.createJob.emit(this.newJob);
    this.newJob = {
      title: '',
      description: '',
      estimatedAmount: 0,
      status: 'ESTIMATE',
      customerId: 0,
    };
  }

  editingJob: Job | null = null;

  startEditJob(job: Job): void {
    this.editingJob = { ...job };
  }

  cancelEditJob(): void {
    this.editingJob = null;
  }

  jobUpdated = output<Job>();

  saveJob(): void {
    if (!this.editingJob) {
      return;
    }
    this.jobUpdated.emit(this.editingJob);
    this.editingJob = null;
  }

  deleteJob = output<number>();
}
