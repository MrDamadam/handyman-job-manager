import { Injectable, signal } from '@angular/core';
import { Customer } from '../models/customer';
import { CustomerService } from '../services/customer.service';
import { SaveRequest } from '../shared/save-state';

@Injectable({
  providedIn: 'root',
})
export class CustomerFacade {
  private readonly customerState = signal<Customer[]>([]);
  private readonly errorState = signal<string | null>(null);

  readonly customers = this.customerState.asReadonly();
  readonly error = this.errorState.asReadonly();

  constructor(private customerService: CustomerService) {}

  load(): void {
    this.errorState.set(null);

    this.customerService.getCustomers().subscribe({
      next: (customers) => this.customerState.set(customers),
      error: () => {
        this.errorState.set('Unable to load customers. Please reload the page.');
      },
    });
  }

  create(request: SaveRequest<Omit<Customer, 'id'>>): void {
    this.customerService.createCustomer(request.value).subscribe({
      next: (createdCustomer) => {
        this.customerState.update((customers) => [...customers, createdCustomer]);
        request.succeed();
      },
      error: (error) => request.fail(error),
    });
  }

  update(request: SaveRequest<Customer>): void {
    this.customerService.updateCustomer(request.value).subscribe({
      next: (updatedCustomer) => {
        this.customerState.update((customers) =>
          customers.map((customer) =>
            customer.id === updatedCustomer.id ? updatedCustomer : customer,
          ),
        );
        request.succeed();
      },
      error: (error) => request.fail(error),
    });
  }

  delete(id: number): void {
    this.errorState.set(null);

    this.customerService.deleteCustomer(id).subscribe({
      next: () => {
        this.customerState.update((customers) =>
          customers.filter((customer) => customer.id !== id),
        );
      },
      error: (error) => {
        this.errorState.set(error.error?.error ?? 'Unable to delete customer. Please try again.');
      },
    });
  }
}
