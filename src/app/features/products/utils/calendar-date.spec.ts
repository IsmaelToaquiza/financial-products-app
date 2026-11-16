import { revisionDateFor, toCalendarDate } from './calendar-date';

describe('Calendar dates', () => {
  it('preserves calendar components for date-only strings and ISO timestamps', () => {
    expect(toCalendarDate('2090-01-15')).toBe('2090-01-15');
    expect(toCalendarDate('2090-01-15T00:00:00.000Z')).toBe('2090-01-15');
    expect(toCalendarDate('2090-01-15T00:00:00+14:00')).toBe('2090-01-15');
  });
  it.each(['', '2090-02-30', '2027-02-29', '2090-13-01', '15/01/2090', '2090-01-15T99:00:00Z'])(
    'rejects invalid date %s',
    (value) => {
      expect(() => toCalendarDate(value)).toThrow();
    },
  );
  it('calculates one calendar year and keeps the documented leap-day rollover', () => {
    expect(revisionDateFor('2090-01-15')).toBe('2091-01-15');
    expect(revisionDateFor('2028-02-29')).toBe('2029-03-01');
  });
});
