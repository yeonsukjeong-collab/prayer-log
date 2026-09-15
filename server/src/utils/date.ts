/** Returns the timestamp exclusive-upper-bound for the calendar day of `date` (start of the next day). */
export function endOfDayExclusive(date: Date): Date {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}
