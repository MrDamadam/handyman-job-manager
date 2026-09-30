import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice } from '../models/invoice';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private apiUrl = 'http://localhost:8080/api/invoices';

  constructor(private http: HttpClient) {}

  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(this.apiUrl);
  }

  createInvoice(jobId: number, invoice: Partial<Invoice>): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/job/${jobId}`, invoice);
  }

  updateInvoice(invoice: Invoice): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.apiUrl}/${invoice.id}`, invoice);
  }

  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
