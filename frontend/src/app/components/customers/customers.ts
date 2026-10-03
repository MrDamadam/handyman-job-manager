import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../models/customer';

@Component({
  selector: 'app-customers',
  imports: [FormsModule],
  templateUrl: './customers.html',
  styleUrl: './customers.css',
})
export class Customers {
  customers = input.required<Customer[]>();

  newCustomer = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  };

  createCustomer = output<typeof this.newCustomer>();

  resetNewCustomer(): void {
    this.newCustomer = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    };
  }

  submitNewCustomer(): void {
    this.createCustomer.emit(this.newCustomer);
    this.resetNewCustomer();
  }

  editingCustomer: Customer | null = null;

  startEdit(customer: Customer): void {
    this.editingCustomer = { ...customer };
  }

  cancelEdit(): void {
    this.editingCustomer = null;
  }

  customerUpdated = output<Customer>();

  saveCustomer(): void {
    if (!this.editingCustomer) {
      return;
    }
    this.customerUpdated.emit(this.editingCustomer);
    this.editingCustomer = null;
  }

  deleteCustomer = output<number>();
}
