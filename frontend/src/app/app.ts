import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Customer } from './models/customer';
import { CustomerService } from './services/customer.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  constructor(private customerService: CustomerService) {}
  public customers = signal<Customer[]>([]);
  ngOnInit(): void {
    this.customerService.getCustomers().subscribe((customers) => {
      this.customers.set(customers);
    });
  }
}
