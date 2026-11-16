import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'calendarDate' })
export class CalendarDatePipe implements PipeTransform {
  transform(value: string): string {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
}
