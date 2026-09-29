import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Customer } from './models/customer';
import { CustomerService } from './services/customer.service';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [RouterOutlet, FormsModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  constructor(private customerService: CustomerService) {}

  public customers = signal<Customer[]>([]);

  newCustomer = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  };

  ngOnInit(): void {
    this.customerService.getCustomers().subscribe((customers) => {
      this.customers.set(customers);
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

    this.customerService.updateCustomer(this.editingCustomer).subscribe(updatedCustomer => {
      this.customers.update(customers => customers.map(customer => customer.id === updatedCustomer.id ? updatedCustomer : customer));
      this.editingCustomer = null;
    })
  }
}
