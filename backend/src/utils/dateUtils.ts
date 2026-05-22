type Day = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export const days: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const JAPAN_TIME_DIFF = 9;

type Month =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "December";

const months: Month[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Get the first Date of the month after `months` months from `date`.
export function getFirstDateInMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const d = new Date(Date.UTC(year, month + months, 1));
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

// Return the number of the week day (e.g., Sun: 0, Mon: 1...)
const getDayNumber = (day: Day): number => {
  return days.indexOf(day);
};

// Calculate the first JST date/time of `day` and `time` after `from`.
export function calculateFirstDate(from: Date, day: Day, time: string): Date {
  const fromInJst = new Date(from.getTime() + JAPAN_TIME_DIFF * 60 * 60 * 1000);
  const offsetDays = (getDayNumber(day) - fromInJst.getUTCDay() + 7) % 7;
  const [hour, minute] = time.split(":").map(Number);
  const candidate = new Date(
    Date.UTC(
      fromInJst.getUTCFullYear(),
      fromInJst.getUTCMonth(),
      fromInJst.getUTCDate() + offsetDays,
      hour - JAPAN_TIME_DIFF,
      minute,
    ),
  );

  if (candidate < from) {
    candidate.setUTCDate(candidate.getUTCDate() + 7);
  }

  return candidate;
}

export const getMonthNumber = (month: Month): number => {
  return months.indexOf(month);
};

// Convert a date string to ISO format in UTC time zone.
// Example 1: "01/05/2025" or "2025-01-05" (UTC) => "2025-01-05T00:00:00.000Z" (UTC)
// Example 2: "01/05/2025" or "2025-01-05" (JST) => "2025-01-04T16:00:00.000Z" (UTC)
export function convertToISOString(
  dateStr: string,
  timezone: string = "UTC",
): string {
  let year: number, month: number, day: number;

  // 1. YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    [year, month, day] = dateStr.split("-").map(Number);
  }
  // 2. MM/DD/YYYY
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    [month, day, year] = dateStr.split("/").map(Number);
  }
  // 3. Other formats -> Throw an error
  else {
    throw new Error(`Unsupported date format: ${dateStr}`);
  }

  switch (timezone) {
    case "Asia/Tokyo":
      const jstDate = new Date(Date.UTC(year, month - 1, day, -9, 0, 0));
      return jstDate.toISOString();
    default:
      return new Date(Date.UTC(year, month - 1, day)).toISOString();
  }
}

export const nHoursLater = (n: number, dateTime: Date = new Date()) => {
  return new Date(dateTime.getTime() + n * 60 * 60 * 1000);
};

export const nHoursBefore = (n: number, dateTime: Date = new Date()): Date => {
  return new Date(dateTime.getTime() - n * 60 * 60 * 1000);
};

export const nDaysLater = (n: number, dateTime: Date = new Date()) => {
  return nHoursLater(n * 24, dateTime);
};

export function isSameLocalDate(
  utcDateTime: Date | string,
  timeZone: string,
): boolean {
  const localToday = new Date().toLocaleDateString("en-CA", { timeZone });
  const localTarget = new Date(utcDateTime).toLocaleDateString("en-CA", {
    timeZone,
  });

  return localToday === localTarget;
}

// Formats a UTC date into a localized year, date and time string based on the specified locale and time zone.: e.g., "Thu, January 11 at 09:30", "1月11日(木) 9:30"
export const formatYearDateTime = (
  utcDate: Date | string,
  locale: string = "ja-JP",
  timeZone: string = "Asia/Tokyo",
): string => {
  const date = new Date(utcDate);

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

// Get the first date of the year that is a designated day.
export const getFirstDesignatedDayOfYear = (year: number, day: Day): Date => {
  // Create a date object for January 1st of the specified year based on UTC
  const date = new Date(Date.UTC(year, 0, 1));

  // Set the date to the first occurrence of the specified day in that year
  while (date.getDay() !== getDayNumber(day)) {
    date.setDate(date.getDate() + 1);
  }

  return date;
};

/**
 * Returns the start and end of the day in JST (00:00:00–23:59:59.999) as UTC Date objects.
 * @param dateTime A UTC datetime (Date object or ISO string)
 * @returns An object containing startOfDay and endOfDay in UTC
 */
export function getJstDayRange(dateTime: string | Date): {
  startOfDay: Date;
  endOfDay: Date;
} {
  const targetDate = new Date(dateTime);

  // Convert to JST by adding 9 hours
  const jstTime = targetDate.getTime() + 9 * 60 * 60 * 1000;
  const jstDate = new Date(jstTime);

  // Extract JST year, month, and day using UTC getters
  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jstDate.getUTCDate()).padStart(2, "0");
  const dateOnly = `${year}-${month}-${day}`; // e.g. "2025-07-30"

  // Create start of JST day in UTC (JST 00:00 → UTC 15:00 on previous day)
  const startOfDay = new Date(`${dateOnly}T00:00:00.000Z`);
  startOfDay.setUTCHours(startOfDay.getUTCHours() - 9);

  // Create end of JST day in UTC (JST 23:59:59 → UTC 14:59:59)
  const endOfDay = new Date(`${dateOnly}T23:59:59.999Z`);
  endOfDay.setUTCHours(endOfDay.getUTCHours() - 9);

  return { startOfDay, endOfDay };
}

// Converts a date from UTC to the specified timezone.
export function convertToTimezoneDate(date: Date, timezoneTo: string): Date {
  switch (timezoneTo) {
    case "Asia/Tokyo":
      const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
      return jstDate;
    default:
      return date;
  }
}

// Converts a date from the specified timezone to UTC.
export function convertToUTCDate(date: Date, timezoneFrom: string): Date {
  switch (timezoneFrom) {
    case "Asia/Tokyo":
      const jstDate = new Date(date.getTime() - 9 * 60 * 60 * 1000);
      return jstDate;
    default:
      return date;
  }
}

// Extract only the date (e.g., "2026-05-21")
export const toDateKey = (d: Date) => d.toISOString().split("T")[0];
