import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CustomerFacade } from './customer.facade';
import { CustomerService } from '../services/customer.service';
import { Customer } from '../models/customer';
import { SaveRequest } from '../shared/save-state';

describe('CustomerFacade', () => {
  const alex: Customer = {
    id: 1,
    firstName: 'Alex',
    lastName: 'Smith',
    email: 'alex@example.com',
    phone: '',
  };

  const bill: Customer = {
    id: 2,
    firstName: 'Bill',
    lastName: 'Jones',
    email: 'bill@example.com',
    phone: '',
  };

  const draft: Omit<Customer, 'id'> = {
    firstName: 'Sam',
    lastName: 'Green',
    email: 'sam@example.com',
    phone: '',
  };

  function makeApi() {
    return {
      getCustomers: vi.fn(() => of([alex, bill])),
      createCustomer: vi.fn((value: Omit<Customer, 'id'>) => of({ ...value, id: 3 })),
      updateCustomer: vi.fn((value: Customer) => of(value)),
      deleteCustomer: vi.fn((id: number) => of(undefined)),
    };
  }

  function makeRequest<T>(value: T) {
    return {
      value,
      succeed: vi.fn(),
      fail: vi.fn(),
    } satisfies SaveRequest<T>;
  }

  let api: ReturnType<typeof makeApi>;
  let facade: CustomerFacade;

  beforeEach(() => {
    api = makeApi();

    TestBed.configureTestingModule({
      providers: [CustomerFacade, { provide: CustomerService, useValue: api }],
    });

    facade = TestBed.inject(CustomerFacade);
    facade.load();
  });

  it('waits for successful creation before adding the customer', () => {
    const response = new Subject<Customer>();
    api.createCustomer.mockReturnValue(response);
    const request = makeRequest(draft);

    facade.create(request);

    expect(api.createCustomer).toHaveBeenCalledWith(draft);
    expect(facade.customers()).toEqual([alex, bill]);
    expect(request.succeed).not.toHaveBeenCalled();

    const created = { ...draft, id: 3 };
    response.next(created);
    response.complete();

    expect(facade.customers()).toEqual([alex, bill, created]);
    expect(request.succeed).toHaveBeenCalledOnce();
    expect(request.fail).not.toHaveBeenCalled();
  });

  it('reports failed creation without changing the list', () => {
    const error = { error: { email: 'Invalid email address' } };
    api.createCustomer.mockReturnValue(throwError(() => error));
    const request = makeRequest(draft);

    facade.create(request);

    expect(facade.customers()).toEqual([alex, bill]);
    expect(request.fail).toHaveBeenCalledWith(error);
    expect(request.succeed).not.toHaveBeenCalled();
  });

  it('replaces the updated customer and preserves other customers', () => {
    const updated = { ...alex, firstName: 'Alexander' };
    const request = makeRequest(updated);

    facade.update(request);

    expect(api.updateCustomer).toHaveBeenCalledWith(updated);
    expect(facade.customers()).toEqual([updated, bill]);
    expect(request.succeed).toHaveBeenCalledOnce();
    expect(request.fail).not.toHaveBeenCalled();
  });

  it('preserves the original customer when an update fails', () => {
    const error = { status: 0 };
    api.updateCustomer.mockReturnValue(throwError(() => error));
    const request = makeRequest({ ...alex, firstName: 'Alexander' });

    facade.update(request);

    expect(facade.customers()).toEqual([alex, bill]);
    expect(request.fail).toHaveBeenCalledWith(error);
    expect(request.succeed).not.toHaveBeenCalled();
  });

  it('keeps a customer after failed deletion and clears the error on retry', () => {
    api.deleteCustomer.mockReturnValueOnce(
      throwError(() => ({
        error: {
          error: 'Customer cannot be deleted because they have jobs',
        },
      })),
    );

    facade.delete(alex.id);

    expect(facade.customers()).toEqual([alex, bill]);
    expect(facade.error()).toBe('Customer cannot be deleted because they have jobs');

    // The next fake API response succeeds.
    facade.delete(alex.id);

    expect(api.deleteCustomer).toHaveBeenLastCalledWith(alex.id);
    expect(facade.customers()).toEqual([bill]);
    expect(facade.error()).toBeNull();
  });
});
