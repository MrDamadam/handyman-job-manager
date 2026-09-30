export interface Invoice {
  id: number;
  amount: number;
  issuedDate: string;
  paidDate: string | null;
  status: InvoiceStatus;
  jobId: number;
  jobTitle: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';
