import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { ProductForm } from './product-form';
import { ProductsApi } from '../../products/services/products-api.service';
import { ProductValidators } from '../../products/validators/product.validators';

describe('ProductForm', () => {
  let component: ProductForm;
  let fixture: ComponentFixture<ProductForm>;
  const api = { createProduct: jest.fn() };

  beforeEach(async () => {
    api.createProduct.mockReset().mockReturnValue(of({}));
    await TestBed.configureTestingModule({
      imports: [ProductForm],
      providers: [
        provideRouter([]),
        { provide: ProductsApi, useValue: api },
        { provide: ProductValidators, useValue: { uniqueProductId: () => () => of(null) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fillForm() {
    component.productForm.patchValue({
      id: 'abc',
      name: 'Producto',
      description: 'Descripción válida',
      logo: 'logo.png',
      dateRelease: '2090-01-15',
    });
    fixture.detectChanges();
  }

  function submit() {
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  it('shows validation messages when submitting an empty form without posting', () => {
    submit();
    expect(api.createProduct).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('El ID es obligatorio!');
    expect(fixture.nativeElement.textContent).toContain('Revisa los campos');
  });

  it('calculates the revision date and posts the DTO through the form event', () => {
    fillForm();
    submit();
    expect(api.createProduct).toHaveBeenCalledWith({
      id: 'abc',
      name: 'Producto',
      description: 'Descripción válida',
      logo: 'logo.png',
      date_release: '2090-01-15',
      date_revision: '2091-01-15',
    });
    expect(fixture.nativeElement.textContent).toContain('Producto creado correctamente.');
  });

  it('rejects a five-character name as required by the backend', () => {
    fillForm();
    component.productForm.controls.name.setValue('ABCDE');
    submit();
    expect(api.createProduct).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Debe tener al menos 6 caracteres.');
  });

  it('shows request errors and allows another submission', () => {
    api.createProduct.mockReturnValue(throwError(() => new Error('offline')));
    fillForm();
    submit();
    expect(fixture.nativeElement.textContent).toContain('No se pudo crear el producto.');
    expect(component.saving()).toBe(false);
  });

  it('prevents duplicate requests while saving', () => {
    api.createProduct.mockReturnValue(new Subject());
    fillForm();
    submit();
    component.onSubmit();
    expect(api.createProduct).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
  });

  it('explains server validation failures', () => {
    api.createProduct.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    fillForm();
    submit();
    expect(component.errorMessage()).toContain('El servidor rechazó');
  });

  it('shows ID and date validation errors and pending verification', () => {
    const controls = component.productForm.controls;
    for (const [error, text] of [
      ['idTaken', 'ya existe'],
      ['verificationUnavailable', 'No se pudo verificar'],
      ['maxlength', 'como máximo'],
      ['datePast', 'anterior a hoy'],
    ] as const) {
      const control = error === 'datePast' ? controls.dateRelease : controls.id;
      control.markAsTouched();
      control.setErrors({ [error]: error === 'maxlength' ? { requiredLength: 10 } : true });
      expect(component.fieldError(error === 'datePast' ? 'dateRelease' : 'id')).toContain(text);
    }
    controls.id.markAsPending();
    submit();
    expect(component.errorMessage()).toContain('Espera');
    component.retryIdVerification();
    component.onReset();
    controls.dateRelease.setValue('');
    expect(controls.dateRevision.value).toBe('');
  });

  it('rejects whitespace-only IDs and validates length after normalization', () => {
    component.productForm.controls.id.setValue('   ');
    expect(component.productForm.controls.id.value).toBe('');
    expect(component.productForm.controls.id.hasError('required')).toBe(true);
    component.productForm.controls.id.setValue(' ab ');
    expect(component.productForm.controls.id.hasError('minlength')).toBe(true);
  });

  it('connects errors to inputs and exposes required and invalid states', () => {
    submit();
    const input = fixture.nativeElement.querySelector('#id');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('id-error');
    expect(fixture.nativeElement.querySelector('#id-error').textContent).toContain('obligatorio');
  });

  it('resets fields and feedback', () => {
    fillForm();
    submit();
    fixture.nativeElement.querySelector('button[type="button"]').click();
    fixture.detectChanges();
    expect(component.productForm.controls.id.value).toBe('');
    expect(component.productForm.controls.dateRevision.value).toBe('');
    expect(component.successMessage()).toBeNull();
    expect(component.productForm.touched).toBe(false);
  });
});

describe('ProductForm editing', () => {
  const original = {
    id: 'abc',
    name: 'Producto',
    description: 'Descripción válida',
    logo: 'logo.png',
    dateRelease: '2090-01-15',
    dateRevision: '2091-01-15',
  };
  const api = { getProduct: jest.fn(), updateProduct: jest.fn(), createProduct: jest.fn() };
  beforeEach(() => {
    api.getProduct.mockReset().mockReturnValue(of(original));
    api.updateProduct.mockReset().mockReturnValue(of({}));
    api.createProduct.mockReset();
    TestBed.configureTestingModule({
      imports: [ProductForm],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'abc' }) },
            paramMap: of(convertToParamMap({ id: 'abc' })),
          },
        },
        { provide: ProductsApi, useValue: api },
        { provide: ProductValidators, useValue: { uniqueProductId: () => () => of(null) } },
      ],
    });
  });
  it('prefills fields, locks ID, updates rather than creates and restores original values', () => {
    const f = TestBed.createComponent(ProductForm);
    f.detectChanges();
    const c = f.componentInstance;
    expect(c.productForm.controls.id.disabled).toBe(true);
    c.productForm.controls.name.setValue('Actualizado');
    c.onSubmit();
    expect(api.updateProduct).toHaveBeenCalledWith(
      'abc',
      expect.objectContaining({ name: 'Actualizado', id: 'abc' }),
    );
    expect(api.createProduct).not.toHaveBeenCalled();
    expect(c.successMessage()).toContain('actualizado');
    c.onReset();
    expect(c.productForm.getRawValue()).toEqual(original);
  });
  it('shows load errors', () => {
    api.getProduct.mockReturnValue(throwError(() => new Error()));
    const f = TestBed.createComponent(ProductForm);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No se pudo cargar');
    expect(f.nativeElement.querySelector('button[type=submit]').disabled).toBe(true);
  });
  it('blocks operations during initial loading and saving', () => {
    const pending = new Subject();
    api.getProduct.mockReturnValue(pending);
    const f = TestBed.createComponent(ProductForm);
    const c = f.componentInstance;
    c.onSubmit();
    c.onReset();
    expect(api.updateProduct).not.toHaveBeenCalled();
    pending.next(original);
    pending.complete();
    api.updateProduct.mockReturnValue(new Subject());
    c.onSubmit();
    c.onReset();
    expect(c.productForm.getRawValue()).toEqual(original);
  });
});
