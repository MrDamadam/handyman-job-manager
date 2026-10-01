import { Component, input, output } from '@angular/core';
import { Customer } from '../../models/customer';
import { FormsModule } from '@angular/forms';

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

  deleteCustomer = output<number>();

  editingCustomer: Customer | null = null;

  customerUpdated = output<Customer>();

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

    this.customerUpdated.emit(this.editingCustomer);
    this.editingCustomer = null;
  }

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
}
