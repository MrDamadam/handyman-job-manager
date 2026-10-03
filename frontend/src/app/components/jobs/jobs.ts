import { SaveRequest, SaveState } from '../../shared/save-state';
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
  readonly createState = new SaveState();
  readonly editState = new SaveState();

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

  createJob = output<SaveRequest<typeof this.newJob>>();

  submitNewJob(): void {
    this.createState.submit({ ...this.newJob }, this.createJob, () => {
    this.newJob = {
      title: '',
      description: '',
      estimatedAmount: 0,
      status: 'ESTIMATE',
      customerId: 0,
    };
    });
  }

  editingJob: Job | null = null;

  startEditJob(job: Job): void {
    this.editingJob = { ...job };
  }

  cancelEditJob(): void {
    this.editingJob = null;
  }

  jobUpdated = output<SaveRequest<Job>>();

  saveJob(): void {
    if (!this.editingJob) {
      return;
    }
    this.editState.submit({ ...this.editingJob }, this.jobUpdated, () => {
      this.editingJob = null;
    });
  }

  deleteJob = output<number>();
}
