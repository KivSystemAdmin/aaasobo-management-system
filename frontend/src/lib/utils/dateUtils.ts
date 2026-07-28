import { addMinutes, addMonths, startOfDay, isAfter, format } from "date-fns";
import { TZDate } from "@date-fns/tz";

const JAPAN_TIME_ZONE = "Asia/Tokyo";

// Function to format time for a given time zone(e.g., 19:00)
export const formatTime = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
};

// Formats year and date (e.g., "Thu, Jan 11, 2025", "2025年1月11日(木)")
export const formatYearDate = (date: Date, locale: string = "en-US") => {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

// Formats year,date, and time (e.g., "Thu, January 11, 2025 at 09:30", "2025年1月11日(木) 9:30")
export const formatYearDateTime = (date: Date, locale: string = "en-US") => {
  const datePart = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

  const timePart = formatTime24Hour(date);
  const formatted =
    locale === "en-US"
      ? `${datePart} at ${timePart}`
      : `${datePart} ${timePart}`;

  return formatted;
};

// Function to format time with added minutes (e.g., 19:25)
export const formatTimeWithAddedMinutes = (
  date: Date,
  minutesToAdd: number,
): string => {
  const updatedDate = addMinutes(date, minutesToAdd);
  return formatTime24Hour(updatedDate);
};

export const isPastPreviousDayDeadline = (classDateUTC: string): boolean => {
  // Convert class date from UTC to Japan time
  const classDateInJapan = new TZDate(classDateUTC, JAPAN_TIME_ZONE);

  // Get the start of the class day in Japan time (00:00:00)
  const classDayStart = startOfDay(classDateInJapan);

  // Get the current date in Japan time (00:00:00 today)
  const todayInJapan = startOfDay(new TZDate(new Date(), JAPAN_TIME_ZONE));

  // If class date is today or in the past, return true (deadline has passed)
  return !isAfter(classDayStart, todayInJapan);
};

const formatDateToISOInTimeZone = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format date in the requested time zone");
  }

  return `${year}-${month}-${day}`;
};

export const getTodayInJapanISODate = (): string => {
  return formatDateToISOInTimeZone(new Date(), JAPAN_TIME_ZONE);
};

// Function to calculate the end time of a class.
export function getEndTime(date: Date): Date {
  return new Date(date.getTime() + 25 * 60 * 1000);
}

// Function to return short form of the day of the week.
export function getWeekday(
  date: Date,
  timeZone: string,
  locale: string = "en-US",
) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone,
  }).format(date);
}

// Converts a date string to the format YYYY-MM-DD.
export const formatBirthdateToISO = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

// e.g., Monday, Tuesday ...
export const getDayOfWeek = (date: Date, locale: string = "en-US"): string => {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "long" });
  return formatter.format(date);
};

// e.g., "en-US": Jan, Feb ..., "ja-JP": 1, 2 ...
export const getShortMonth = (date: Date, locale: string = "en-US"): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  if (locale === "ja-JP") {
    return String(date.getMonth() + 1);
  }

  const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
  return formatter.format(date).toUpperCase();
};

// e.g., "en-US": January, February ..., "ja-JP": 1, 2 ...
export const getLongMonth = (date: Date, locale: string = "en-US"): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  if (locale === "ja-JP") {
    return String(date.getMonth() + 1);
  }

  const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
  return formatter.format(date);
};

// Formats a Date object into a short string according to the selected language(e.g., "Jun 29, 2024" "2024年6月29日") for the "en-US" locale.
export const formatShortDate = (
  date: Date,
  locale: string = "en-US",
  timeZone?: string,
) => {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(timeZone && { timeZone }),
  }).format(date);
};

// Formats a Date object into a 24-hour time string without leading zeros (e.g., "9:00").
export const formatTime24Hour = (date: Date, timeZone?: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timeZone || undefined,
  };

  const formatted = new Intl.DateTimeFormat("en-US", options).format(date);
  return formatted.replace(/^0/, "");
};

export const nHoursLater = (n: number, dateTime: Date = new Date()): Date => {
  return new Date(dateTime.getTime() + n * 60 * 60 * 1000);
};

export const nHoursBefore = (n: number, dateTime: Date = new Date()): Date => {
  return new Date(dateTime.getTime() - n * 60 * 60 * 1000);
};

export const nDaysLater = (days: number, dateTime: Date = new Date()) =>
  new Date(dateTime.getTime() + days * 24 * 60 * 60 * 1000);

export const hasTimePassed = (targetTime: Date | string): boolean =>
  Date.now() > new Date(targetTime).getTime();

export const formatClassDetailFooter = (updatedDateTime: string) => {
  const updatedDate = new Date(updatedDateTime);
  return format(updatedDate, "yyyy-MM-dd-HH:mm");
};
