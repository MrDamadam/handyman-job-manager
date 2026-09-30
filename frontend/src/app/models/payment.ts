export interface Payment {
  id: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  invoiceId: number;
}

export type PaymentMethod = 'CASH' | 'CHECK' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'OTHER';
