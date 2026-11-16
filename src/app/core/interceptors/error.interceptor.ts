import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export class ApiHttpError extends HttpErrorResponse {
  readonly userMessage: string | null;

  constructor(error: HttpErrorResponse) {
    super({
      error: error.error,
      headers: error.headers,
      status: error.status,
      statusText: error.statusText,
      url: error.url ?? undefined,
    });
    this.userMessage =
      error.status === 0
        ? 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo nuevamente.'
        : error.status >= 500
          ? 'El servidor no pudo completar la solicitud. Inténtalo nuevamente más tarde.'
          : error.status === 404
            ? 'El recurso solicitado ya no existe o no está disponible.'
            : null;
  }
}

export function httpErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiHttpError ? (error.userMessage ?? fallback) : fallback;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) =>
      throwError(() => (error instanceof HttpErrorResponse ? new ApiHttpError(error) : error)),
    ),
  );
