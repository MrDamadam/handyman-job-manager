import { SaveRequest, SaveState } from '../../shared/save-state';
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
  readonly createState = new SaveState();
  readonly editState = new SaveState();

  customers = input.required<Customer[]>();

  customerError = input<string | null>(null);

  newCustomer = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  };

  createCustomer = output<SaveRequest<typeof this.newCustomer>>();

  resetNewCustomer(): void {
    this.newCustomer = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    };
  }

  submitNewCustomer(): void {
    this.createState.submit({ ...this.newCustomer }, this.createCustomer, () => {
      this.resetNewCustomer();
    });
  }

  editingCustomer: Customer | null = null;

  startEdit(customer: Customer): void {
    this.editingCustomer = { ...customer };
  }

  cancelEdit(): void {
    this.editingCustomer = null;
  }

  customerUpdated = output<SaveRequest<Customer>>();

  saveCustomer(): void {
    if (!this.editingCustomer) {
      return;
    }
    this.editState.submit({ ...this.editingCustomer }, this.customerUpdated, () => {
      this.editingCustomer = null;
    });
  }

  deleteCustomer = output<number>();
}
