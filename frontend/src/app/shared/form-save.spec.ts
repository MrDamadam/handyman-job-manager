import { TestBed } from '@angular/core/testing';
import { Customers } from '../components/customers/customers';
import { Jobs } from '../components/jobs/jobs';
import { Invoices } from '../components/invoices/invoices';
import { Payments } from '../components/payments/payments';
import { SaveRequest } from './save-state';

describe('form save lifecycle', () => {
  for (const [type, entity, inputs] of [
    [Customers, 'Customer', ['customers']],
    [Jobs, 'Job', ['customers', 'jobs']],
    [Invoices, 'Invoice', ['invoices', 'jobs', 'payments']],
    [Payments, 'Payment', ['invoices', 'payments']],
  ] as const) {
    it(`${entity}: preserves failed drafts and resets successful saves`, async () => {
      await TestBed.configureTestingModule({ imports: [type] }).compileComponents();
      const fixture = TestBed.createComponent(type as typeof Customers);
      for (const input of inputs) fixture.componentRef.setInput(input, []);
      const component = fixture.componentInstance as any;
      const key = `new${entity}`;
      const draft = { ...component[key], ...(entity === 'Customer' ? { firstName: 'Alex' } : { amount: 45, title: 'Repair' }) };
      component[key] = draft;
      let request!: SaveRequest<unknown>;
      component[`create${entity}`].subscribe((event: SaveRequest<unknown>) => { request = event; });
      component[`submitNew${entity}`]();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('fieldset').disabled).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('Saving…');
      request.fail({ status: 0 });
      fixture.detectChanges();
      expect(component[key]).toEqual(draft);
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Unable to reach');
      component[`submitNew${entity}`]();
      request.succeed();
      fixture.detectChanges();
      expect(component[key]).not.toEqual(draft);
      expect(fixture.nativeElement.querySelector('fieldset').disabled).toBe(false);
    });
  }

  it('keeps an editor open on error and closes it only on success', async () => {
    await TestBed.configureTestingModule({ imports: [Customers] }).compileComponents();
    const fixture = TestBed.createComponent(Customers);
    fixture.componentRef.setInput('customers', []);
    const component = fixture.componentInstance;
    component.startEdit({ id: 1, firstName: 'Alex', lastName: 'Smith', email: 'alex@example.com', phone: '' });
    let request!: SaveRequest<unknown>;
    component.customerUpdated.subscribe(event => { request = event; });
    component.saveCustomer();
    request.fail({ error: { error: 'Cannot save' } });
    expect(component.editingCustomer?.firstName).toBe('Alex');
    component.saveCustomer();
    request.succeed();
    expect(component.editingCustomer).toBeNull();
  });
});
