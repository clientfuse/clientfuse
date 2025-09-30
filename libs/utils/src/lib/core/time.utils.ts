/**
 * Converts minutes to milliseconds
 * @param minutes - number of minutes
 * @returns number of milliseconds
 */
export function minToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * Converts seconds to milliseconds
 * @param seconds - number of seconds
 * @returns number of milliseconds
 */
export function secToMs(seconds: number): number {
  return seconds * 1000;
}

/**
 * Converts hours to milliseconds
 * @param hours - number of hours
 * @returns number of milliseconds
 */
export function hoursToMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

/**
 * Converts days to milliseconds
 * @param days - number of days
 * @returns number of milliseconds
 */
export function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

/**
 * Converts milliseconds to minutes
 * @param ms - number of milliseconds
 * @returns number of minutes
 */
export function msToMin(ms: number): number {
  return ms / (60 * 1000);
}

/**
 * Converts milliseconds to seconds
 * @param ms - number of milliseconds
 * @returns number of seconds
 */
export function msToSec(ms: number): number {
  return ms / 1000;
}

/**
 * Converts milliseconds to hours
 * @param ms - number of milliseconds
 * @returns number of hours
 */
export function msToHours(ms: number): number {
  return ms / (60 * 60 * 1000);
}

/**
 * Converts milliseconds to days
 * @param ms - number of milliseconds
 * @returns number of days
 */
export function msToDays(ms: number): number {
  return ms / (24 * 60 * 60 * 1000);
}
