import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL, ProductsApi } from './products-api.service';
import { ProductMapper } from '../mappers/product-mapper';

export const dto = {
  id: 'abc',
  name: 'Producto',
  description: 'Descripción válida',
  logo: 'logo.png',
  date_release: '2090-01-15',
  date_revision: '2091-01-15',
};
describe('ProductsApi', () => {
  let service: ProductsApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/bp/' },
      ],
    });
    service = TestBed.inject(ProductsApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('maps list responses', () => {
    service
      .getProducts()
      .subscribe((value) => expect(value).toEqual([ProductMapper.toProduct(dto)]));
    http.expectOne('/bp/products').flush({ data: [dto] });
  });
  it('loads a product using an encoded identifier', () => {
    service.getProduct('a/b').subscribe((value) => expect(value.id).toBe('abc'));
    http.expectOne('/bp/products/a%2Fb').flush(dto);
  });
  it('verifies identifiers', () => {
    service.verifyProductId('a/b').subscribe((value) => expect(value).toBe(true));
    http.expectOne('/bp/products/verification/a%2Fb').flush(true);
  });
  it.each(['create', 'update'])('%s unwraps the server response', (action) => {
    const request =
      action === 'create' ? service.createProduct(dto) : service.updateProduct(dto.id, dto);
    request.subscribe((value) => expect(value).toEqual(dto));
    const req = http.expectOne(action === 'create' ? '/bp/products' : '/bp/products/abc');
    expect(req.request.method).toBe(action === 'create' ? 'POST' : 'PUT');
    expect(req.request.body).toEqual(dto);
    req.flush({ data: dto, message: 'OK' });
  });
  it('deletes a product', () => {
    service.deleteProduct('abc').subscribe();
    const req = http.expectOne('/bp/products/abc');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'OK' });
  });
});
