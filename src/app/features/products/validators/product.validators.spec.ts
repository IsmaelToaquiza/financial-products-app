import { FormControl, FormGroup } from '@angular/forms';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { ProductValidators } from './product.validators';
import { ProductsApi } from '../services/products-api.service';

describe('ProductValidators', () => {
  it('validates release dates against the local calendar', () => {
    const validator = ProductValidators.releaseDateNotPast();
    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl('2000-01-01'))).toEqual({ datePast: true });
    expect(validator(new FormControl('2090-01-01'))).toBeNull();
  });
  it('requires exactly one calendar year between dates including leap-day rollover', () => {
    const validate = (a: string, b: string) =>
      ProductValidators.revisionDateYearLater()(
        new FormGroup({ dateRelease: new FormControl(a), dateRevision: new FormControl(b) }),
      );
    expect(validate('', '')).toBeNull();
    expect(validate('2028-02-29', '2029-03-01')).toBeNull();
    expect(validate('2028-02-29', '2029-02-28')).toEqual({ invalidRevisionDate: true });
  });
  it('handles empty, available, taken and failed ID checks', async () => {
    const api = { verifyProductId: jest.fn().mockReturnValue(of(false)) };
    const validator = new ProductValidators(api as unknown as ProductsApi).uniqueProductId();
    const run = (value: string) =>
      firstValueFrom(validator(new FormControl(value)) as import('rxjs').Observable<any>);
    expect(await run('')).toBeNull();
    expect(await run('abc')).toBeNull();
    api.verifyProductId.mockReturnValue(of(true));
    expect(await run('abc')).toEqual({ idTaken: true });
    api.verifyProductId.mockReturnValue(throwError(() => new Error()));
    expect(await run('abc')).toEqual({ verificationUnavailable: true });
  });

  it('cancels obsolete ID checks and does not apply stale responses', () => {
    jest.useFakeTimers();
    try {
      const first = new Subject<boolean>();
      const latest = new Subject<boolean>();
      const api = {
        verifyProductId: jest.fn().mockReturnValueOnce(first).mockReturnValueOnce(latest),
      };
      const validator = new ProductValidators(api as unknown as ProductsApi).uniqueProductId();
      const control = new FormControl('', { asyncValidators: [validator] });
      control.setValue('abc');
      jest.advanceTimersByTime(1000);
      control.setValue('xyz');
      expect(first.observed).toBe(false);
      jest.advanceTimersByTime(1000);
      latest.next(true);
      latest.complete();
      first.next(false);
      expect(control.hasError('idTaken')).toBe(true);
      expect(api.verifyProductId.mock.calls).toEqual([['abc'], ['xyz']]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('accepts today and the unchanged original date but rejects invalid calendar dates', () => {
    const today = new Date();
    const value = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
    expect(ProductValidators.releaseDateNotPast()(new FormControl(value))).toBeNull();
    expect(
      ProductValidators.releaseDateNotPast(() => '2000-01-01')(new FormControl('2000-01-01')),
    ).toBeNull();
    expect(ProductValidators.releaseDateNotPast()(new FormControl('2090-02-30'))).toEqual({
      invalidDate: true,
    });
    expect(
      ProductValidators.revisionDateYearLater()(
        new FormGroup({
          dateRelease: new FormControl('bad'),
          dateRevision: new FormControl('2090-01-01'),
        }),
      ),
    ).toEqual({ invalidRevisionDate: true });
  });
});
