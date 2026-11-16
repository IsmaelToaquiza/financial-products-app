/** Preserve the calendar date supplied by the API, without applying a timezone shift. */
export function toCalendarDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
  if (!match) throw new Error('Formato de fecha inválido.');
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    (value.length > 10 && Number.isNaN(Date.parse(value)))
  )
    throw new Error('Fecha de calendario inválida.');
  return value.slice(0, 10);
}

export function revisionDateFor(value: string): string {
  const date = new Date(`${toCalendarDate(value)}T00:00:00.000Z`);
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return toCalendarDate(date.toISOString());
}
