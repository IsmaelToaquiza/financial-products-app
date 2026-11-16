import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ProductList } from './product-list';
import { ProductsApi } from '../../products/services/products-api.service';

const product = {
  id: 'abc',
  name: 'Producto',
  description: 'Descripción válida',
  logo: 'logo.png',
  dateRelease: '2090-01-15',
  dateRevision: '2091-01-15',
};
describe('ProductList', () => {
  const api = { getProducts: jest.fn(), deleteProduct: jest.fn() };
  beforeEach(() => {
    api.getProducts
      .mockReset()
      .mockReturnValue(
        of(
          Array.from({ length: 22 }, (_, i) => ({
            ...product,
            id: String(i),
            name: `Producto ${i}`,
          })),
        ),
      );
    api.deleteProduct.mockReset().mockReturnValue(of(undefined));
    TestBed.configureTestingModule({
      imports: [ProductList],
      providers: [provideRouter([]), { provide: ProductsApi, useValue: api }],
    });
  });
  function mount() {
    const f = TestBed.createComponent(ProductList);
    f.detectChanges();
    return f;
  }
  it('limits rows and changes the page size through the DOM', () => {
    const f = mount();
    expect(f.nativeElement.querySelectorAll('tbody tr')).toHaveLength(5);
    const select = f.nativeElement.querySelector('select');
    select.value = '20';
    select.dispatchEvent(new Event('change'));
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('tbody tr')).toHaveLength(20);
    select.value = '10';
    select.dispatchEvent(new Event('change'));
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('tbody tr')).toHaveLength(10);
    f.componentInstance.onPageSizeChange({ target: { value: '7' } } as unknown as Event);
    expect(f.componentInstance.pageSize()).toBe(10);
  });
  it('filters by name and description and shows empty results', () => {
    const f = mount();
    const input = f.nativeElement.querySelector('input');
    input.value = '  PRODUCTO 21 ';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('tbody tr')).toHaveLength(1);
    input.value = 'descripción';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(f.componentInstance.filteredProducts()).toHaveLength(22);
    input.value = 'missing';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No se encontraron');
  });
  it('shows loading, errors and supports retry', () => {
    const pending = new Subject<any>();
    api.getProducts.mockReturnValue(pending);
    const f = mount();
    expect(f.nativeElement.querySelector('app-loading-skeleton')).not.toBeNull();
    pending.error(new Error());
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role=alert]')).not.toBeNull();
    api.getProducts.mockReturnValue(of([]));
    f.nativeElement.querySelector('button').click();
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No se encontraron');
  });
  it('deletes only after confirmation and removes the matching row', () => {
    const f = mount();
    const c = f.componentInstance;
    c.confirmDeletion();
    expect(api.deleteProduct).not.toHaveBeenCalled();
    c.selectForDeletion(c.products()[0]);
    c.cancelDeletion();
    expect(c.selectedProduct()).toBeNull();
    c.selectForDeletion(c.products()[0]);
    c.confirmDeletion();
    expect(api.deleteProduct).toHaveBeenCalledWith('0');
    expect(c.products()).toHaveLength(21);
  });
  it('keeps the dialog open after a deletion error and prevents duplicate requests', () => {
    const f = mount();
    const c = f.componentInstance;
    c.selectForDeletion(c.products()[0]);
    api.deleteProduct.mockReturnValue(throwError(() => new Error()));
    c.confirmDeletion();
    expect(c.deleteError()).toContain('No se pudo');
    const pending = new Subject<void>();
    api.deleteProduct.mockReturnValue(pending);
    c.confirmDeletion();
    c.confirmDeletion();
    c.cancelDeletion();
    expect(c.selectedProduct()).not.toBeNull();
    expect(api.deleteProduct).toHaveBeenCalledTimes(2);
    pending.next();
    pending.complete();
  });
});
