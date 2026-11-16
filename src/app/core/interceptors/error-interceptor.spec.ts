import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { throwError } from 'rxjs';
import { ApiHttpError, errorInterceptor, httpErrorMessage } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });
  afterEach(() => controller.verify());

  it.each([
    [0, 'No se pudo conectar'],
    [404, 'El recurso solicitado'],
    [503, 'El servidor no pudo completar'],
    [400, 'Mensaje del componente'],
  ])('handles HTTP %s without losing status or body', (status, expected) => {
    const payload = { message: 'Backend details' };
    let received: ApiHttpError | undefined;
    http.get('/bp/products').subscribe({
      error: (error) => {
        received = error;
      },
    });
    const req = controller.expectOne('/bp/products');
    if (status === 0) req.error(new ProgressEvent('error'));
    else
      req.flush(payload, {
        status: Number(status),
        statusText: 'Error',
        headers: { 'X-Test': 'preserved' },
      });
    expect(received).toBeInstanceOf(HttpErrorResponse);
    expect(received?.status).toBe(status);
    expect(received?.url).toBe('/bp/products');
    if (status !== 0) {
      expect(received?.error).toEqual(payload);
      expect(received?.headers.get('X-Test')).toBe('preserved');
    }
    expect(httpErrorMessage(received, 'Mensaje del componente')).toContain(expected);
  });

  it('passes successful responses unchanged', () => {
    let result: unknown;
    http.get('/bp/products').subscribe((value) => (result = value));
    controller.expectOne('/bp/products').flush({ data: [] });
    expect(result).toEqual({ data: [] });
  });

  it('preserves errors that are not HTTP errors and uses the component fallback', () => {
    const original = new Error('unexpected');
    errorInterceptor(new HttpRequest('GET', '/test'), () => throwError(() => original)).subscribe({
      error: (error) => expect(error).toBe(original),
    });
    expect(httpErrorMessage(original, 'Fallback')).toBe('Fallback');
  });
});
