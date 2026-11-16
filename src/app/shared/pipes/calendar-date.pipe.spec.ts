import { CalendarDatePipe } from './calendar-date.pipe';

describe('CalendarDatePipe', () => {
  it('formats calendar components without depending on the timezone', () => {
    const pipe = new CalendarDatePipe();
    expect(pipe.transform('2090-01-15')).toBe('15/01/2090');
    expect(pipe.transform('2028-02-29')).toBe('29/02/2028');
  });
});
