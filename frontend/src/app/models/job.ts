export interface Job {
  id: number;
  title: string;
  description: string;
  estimatedAmount: number;
  createdDate: string;
  status: JobStatus;
  customerId: number;
  customerFirstName: string;
  customerLastName: string;
}

export type JobStatus = 'ESTIMATE' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
