export type Day = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export const days: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const JAPAN_TIME_DIFF = 9;

// Get the first Date of the month after `months` months from `date`.
export function getFirstDateInMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0);
  return d;
}

// Generate the data between `start` and `end` dates including `end`.
export function createDatesBetween(start: Date, end: Date): Date[] {
  const dates = [];
  while (start < end) {
    dates.push(new Date(start));
    start.setUTCDate(start.getUTCDate() + 7);
  }
  return dates;
}
const getDayNumber = (day: Day): number => {
  return days.indexOf(day);
};

// Calculate the first date of `day` and `time` after `from`.
// e.g., from: "2024-08-01", day: "Mon", time: "09:00" => "2024-08-05T00:00:00Z"
export function calculateFirstDate(from: Date, day: Day, time: string): Date {
  const date = new Date(from);

  // The following calculation for setDate works only for after 09:00 in Japanese time.
  // Japanese time is UTC+9. Thus, after 09:00, date.getUTCDay() returns the same day as in Japan.
  date.setDate(
    date.getDate() + ((getDayNumber(day) - date.getUTCDay() + 7) % 7),
  );

  const [hour, minute] = time.split(":");
  date.setUTCHours(parseInt(hour) - JAPAN_TIME_DIFF);
  date.setUTCMinutes(parseInt(minute));
  return date;
}
