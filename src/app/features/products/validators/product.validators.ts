import { revisionDateFor, toCalendarDate } from '../utils/calendar-date';
import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ProductsApi } from '../services/products-api.service';
import { catchError, map, Observable, of, switchMap, timer } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProductValidators {
  constructor(private readonly productsApi: ProductsApi) {}

  uniqueProductId(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = String(control.value ?? '').trim();
      if (!value) return of(null);
      return timer(1000).pipe(
        switchMap(() => this.productsApi.verifyProductId(value)),
        map((isTaken) => (isTaken ? { idTaken: true } : null)),
        catchError(() => of({ verificationUnavailable: true })),
      );
    };
  }

  static releaseDateNotPast(originalDate?: () => string | undefined): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value ?? '');
      const today = new Date();

      const currentDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('-');

      if (!value) return null;
      try {
        toCalendarDate(value);
      } catch {
        return { invalidDate: true };
      }
      if (value === originalDate?.()) return null;

      return value < currentDate ? { datePast: true } : null;
    };
  }

  static revisionDateYearLater(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const releaseDate = String(group.get('dateRelease')?.value ?? '');
      const revisionDate = String(group.get('dateRevision')?.value ?? '');
      if (!releaseDate || !revisionDate) return null;
      try {
        if (toCalendarDate(revisionDate) === revisionDateFor(releaseDate)) return null;
      } catch {
        return { invalidRevisionDate: true };
      }

      return { invalidRevisionDate: true };
    };
  }
}
