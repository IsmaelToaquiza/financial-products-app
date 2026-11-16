import { provideRouter, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductTable } from './product-table';

describe('ProductTable', () => {
  let component: ProductTable;
  let fixture: ComponentFixture<ProductTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [ProductTable],
    }).compileComponents();

    HTMLElement.prototype.togglePopover = jest.fn(() => true);
    HTMLElement.prototype.hidePopover = jest.fn();
    fixture = TestBed.createComponent(ProductTable);
    fixture.componentRef.setInput('products', []);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function renderProduct() {
    fixture.componentRef.setInput('products', [
      {
        id: 'abc',
        name: 'Producto',
        description: 'Descripción válida',
        logo: 'logo.png',
        dateRelease: '2090-01-15',
        dateRevision: '2091-01-15',
      },
    ]);
    fixture.detectChanges();
    return {
      trigger: fixture.nativeElement.querySelector(
        '.product-table__menu-trigger',
      ) as HTMLButtonElement,
      menu: fixture.nativeElement.querySelector('[popover]') as HTMLElement,
    };
  }

  it('opens actions through the contextual trigger and preserves the edit route', () => {
    const { trigger, menu } = renderProduct();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('popovertarget')).toBe(menu.id);
    expect(menu.getAttribute('popover')).toBe('auto');
    trigger.click();
    expect(menu.togglePopover).toHaveBeenCalled();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(menu.querySelector('a')?.getAttribute('href')).toBe('/products/update/abc');
    jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    menu.querySelector('a')?.click();
    expect(menu.hidePopover).toHaveBeenCalled();
  });

  it('emits deletion only when selecting the dropdown action', () => {
    const { trigger, menu } = renderProduct();
    const emit = jest.spyOn(component.deleteProduct, 'emit');
    trigger.click();
    expect(emit).not.toHaveBeenCalled();
    menu.querySelector('button')?.click();
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ id: 'abc' }));
    expect(menu.hidePopover).toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on scroll and resize and updates the expanded state after native dismissal', () => {
    const { trigger, menu } = renderProduct();
    component.closeActions();
    trigger.click();
    fixture.nativeElement
      .querySelector('.product-table__wrapper')
      .dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));
    expect(menu.hidePopover).toHaveBeenCalledTimes(3);
    menu.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'closed' }));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    jest.mocked(menu.togglePopover).mockReturnValueOnce(false);
    trigger.click();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('positions the dropdown above the trigger when there is no space below', () => {
    const { trigger, menu } = renderProduct();
    jest
      .spyOn(trigger, 'getBoundingClientRect')
      .mockReturnValue({ top: 750, bottom: 780, right: 200 } as DOMRect);
    jest
      .spyOn(menu, 'getBoundingClientRect')
      .mockReturnValue({ width: 160, height: 100 } as DOMRect);
    trigger.click();
    expect(menu.style.top).toBe('646px');
    expect(menu.style.left).toBe('40px');
  });
});
