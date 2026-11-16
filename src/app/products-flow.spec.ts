import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { ProductList } from './features/pages/product-list/product-list';
import { ProductForm } from './features/pages/product-form/product-form';

const dto = {
  id: 'abc',
  name: 'Producto',
  description: 'Descripción válida',
  logo: 'logo.png',
  date_release: '2090-01-15',
  date_revision: '2091-01-15',
};
describe('Product routes and HTTP integration', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    HTMLElement.prototype.togglePopover = jest.fn(() => true);
    HTMLElement.prototype.hidePopover = jest.fn();
    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('opens the initial list and exposes create and edit links', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', ProductList);
    http.expectOne('/bp/products').flush({ data: [dto] });
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe(
      '/products/create',
    );
    expect(harness.routeNativeElement?.querySelector('tbody a')?.getAttribute('href')).toBe(
      '/products/update/abc',
    );
    expect(harness.routeNativeElement?.textContent).toContain('15/01/2090');
    await harness.navigateByUrl('/products/create', ProductForm);
    expect(harness.routeNativeElement?.textContent).toContain('Formulario de Registro');
  });

  it('shows a normalized server error and allows retrying the list', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products', ProductList);
    http.expectOne('/bp/products').flush({}, { status: 503, statusText: 'Unavailable' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'El servidor no pudo completar',
    );
    harness.routeNativeElement?.querySelector<HTMLButtonElement>('button')?.click();
    http.expectOne('/bp/products').flush({ data: [] });
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent).toContain(
      'No se encontraron productos',
    );
  });

  it('verifies a new ID and creates using the real form bindings', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products/create', ProductForm);
    function enter(id: string, value: string) {
      const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#' + id)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
    }
    enter('id', 'abc');
    enter('name', 'Producto');
    enter('description', 'Descripción válida');
    enter('logo', 'logo.png');
    enter('dateRelease', '2090-01-15');
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Verificando ID');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    http.expectOne('/bp/products/verification/abc').flush(false);
    harness.detectChanges();
    harness
      .routeNativeElement!.querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const create = http.expectOne('/bp/products');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(dto);
    create.flush({ message: 'OK', data: dto });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Producto creado correctamente');
  });

  it('updates through PUT and confirms deletion through DELETE', async () => {
    const harness = await RouterTestingHarness.create();
    const form = await harness.navigateByUrl('/products/update/abc', ProductForm);
    http.expectOne('/bp/products/abc').flush(dto);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector<HTMLInputElement>('#id')?.disabled).toBe(true);
    form.productForm.controls.name.setValue('Modificado');
    harness.routeNativeElement
      ?.querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const update = http.expectOne('/bp/products/abc');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body.name).toBe('Modificado');
    update.flush({ data: { ...dto, name: 'Modificado' } });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Producto actualizado correctamente');
    await harness.navigateByUrl('/products', ProductList);
    http.expectOne('/bp/products').flush({ data: [dto] });
    harness.detectChanges();
    harness.routeNativeElement
      ?.querySelector<HTMLButtonElement>('.product-table__menu-trigger')
      ?.click();
    harness.detectChanges();
    expect(
      harness.routeNativeElement
        ?.querySelector('.product-table__menu-trigger')
        ?.getAttribute('aria-expanded'),
    ).toBe('true');
    harness.routeNativeElement
      ?.querySelector<HTMLButtonElement>('.product-table__action--delete')
      ?.click();
    harness.detectChanges();
    http.expectNone((req) => req.method === 'DELETE');
    const buttons =
      harness.routeNativeElement?.querySelectorAll<HTMLButtonElement>('dialog button');
    buttons?.[1].click();
    const deletion = http.expectOne('/bp/products/abc');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ message: 'OK' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('dialog')).toBeNull();
    expect(harness.routeNativeElement?.textContent).toContain('No se encontraron productos');
  });

  it('never submits the previous ID after editing without blur and normalizes spaces', async () => {
    const harness = await RouterTestingHarness.create();
    const form = await harness.navigateByUrl('/products/create', ProductForm);
    form.productForm.patchValue({
      id: 'abc',
      name: dto.name,
      description: dto.description,
      logo: dto.logo,
      dateRelease: dto.date_release,
    });
    await new Promise((resolve) => setTimeout(resolve, 1100));
    http.expectOne('/bp/products/verification/abc').flush(false);
    harness.detectChanges();
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#id')!;
    input.value = ' xyz ';
    input.dispatchEvent(new Event('input'));
    const submit = () =>
      harness
        .routeNativeElement!.querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    submit();
    http.expectNone((req) => req.method === 'POST');
    expect(form.productForm.controls.id.value).toBe('xyz');
    expect(form.productForm.pending).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    http.expectOne('/bp/products/verification/xyz').flush(false);
    submit();
    const create = http.expectOne('/bp/products');
    expect(create.request.body.id).toBe('xyz');
    create.flush({ data: { ...dto, id: 'xyz' } });
  });

  it('cancels the previous product load when changing route ID and updates the current one', async () => {
    const harness = await RouterTestingHarness.create();
    const first = await harness.navigateByUrl('/products/update/abc', ProductForm);
    const old = http.expectOne('/bp/products/abc');
    const second = await harness.navigateByUrl('/products/update/xyz', ProductForm);
    expect(second).toBe(first);
    expect(old.cancelled).toBe(true);
    http.expectOne('/bp/products/xyz').flush({ ...dto, id: 'xyz' });
    harness.detectChanges();
    expect(second.editingId).toBe('xyz');
    second.onSubmit();
    const update = http.expectOne('/bp/products/xyz');
    expect(update.request.body.id).toBe('xyz');
    update.flush({ data: { ...dto, id: 'xyz' } });
  });

  it('loads ISO dates and allows editing an unchanged historical release date', async () => {
    const harness = await RouterTestingHarness.create();
    const form = await harness.navigateByUrl('/products/update/abc', ProductForm);
    http
      .expectOne('/bp/products/abc')
      .flush({
        ...dto,
        date_release: '2000-01-15T00:00:00.000Z',
        date_revision: '2001-01-15T00:00:00.000Z',
      });
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#dateRelease')!.value).toBe(
      '2000-01-15',
    );
    form.productForm.controls.description.setValue('Nueva descripción');
    form.onSubmit();
    const update = http.expectOne('/bp/products/abc');
    expect(update.request.body.date_release).toBe('2000-01-15');
    update.flush({ data: dto });
    form.productForm.controls.dateRelease.setValue('2000-02-15');
    expect(form.productForm.controls.dateRelease.hasError('datePast')).toBe(true);
  });

  it('recovers from a failed load when navigating to another product', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products/update/missing', ProductForm);
    http.expectOne('/bp/products/missing').flush({}, { status: 404, statusText: 'Not found' });
    const form = await harness.navigateByUrl('/products/update/abc', ProductForm);
    http.expectOne('/bp/products/abc').flush(dto);
    expect(form.productLoaded()).toBe(true);
    expect(form.errorMessage()).toBeNull();
  });
});
