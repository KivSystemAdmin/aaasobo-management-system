import { addMinutes, startOfDay, isAfter } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";

// Function to format date for a given time zone (e.g., Jun 29, 2024)
export const formatDate = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone,
  }).format(date);
};

// Function to format time for a given time zone(e.g., 19:00)
export const formatTime = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
};

// Function to format date and time for a given time zone (e.g., Mon, July 23, 2024, 19:30)
export const formatDateTime = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
};

// Converts a UTC ISO date string to the specified time zone, calculates the end time by adding 25 minutes,
// and formats both start and end times as "YYYY-MM-DDTHH:MM:SS" for use in calendar events.
export function getClassStartAndEndTimes(isoDateStr: string, timeZone: string) {
  const utcDate = new Date(isoDateStr);
  const zonedStartDate = toZonedTime(utcDate, timeZone);

  const start = zonedStartDate;
  const end = addMinutes(start, 25);

  return {
    start: format(start, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    end: format(end, "yyyy-MM-dd'T'HH:mm:ssXXX"),
  };
}

// Function to format day and date for a given time zone (e.g., Mon, July 23, 2024)
export const formatDayDate = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "2-digit",
    timeZone,
  }).format(date);
};

// Function to format time with added minutes for a given time zone (e.g., 19:25)
export const formatTimeWithAddedMinutes = (
  date: Date,
  timeZone: string,
  minutesToAdd: number,
) => {
  const updatedDate = addMinutes(date, minutesToAdd);
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(updatedDate);
};

// Function to format the previous day for a given time zone (e.g., Jun 28, 2024)
export const formatPreviousDay = (date: Date, timeZone: string) => {
  // Calculate the previous day
  const previousDay = new Date(date);
  previousDay.setDate(previousDay.getDate() - 1);

  // Format the previous day
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone,
  }).format(previousDay);
};

// Function to format the last day of the month, 5 months after a given date
export const formatFiveMonthsLaterEndOfMonth = (
  date: Date | string,
  timeZone: string,
) => {
  const futureDate = new Date(date);

  futureDate.setMonth(futureDate.getMonth() + 5);

  const endOfMonth = new Date(
    futureDate.getFullYear(),
    futureDate.getMonth() + 1,
    0,
  );

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone,
  }).format(endOfMonth);
};

// Function to check if the current date in a particular time zone is past the previous day of the class date
export const isPastPreviousDayDeadline = (
  classDate: string,
  timeZone: string,
): boolean => {
  try {
    // Convert class date to the specified time zone and get the start of the day
    const classDateInTimeZone = toZonedTime(classDate, timeZone);
    const classDateStartOfDay = startOfDay(classDateInTimeZone);

    // Get the previous day from the class date
    const previousDayStart = new Date(classDateStartOfDay);
    previousDayStart.setDate(previousDayStart.getDate() - 1);

    // Get the current date in the specified time zone and get the start of the day
    const currentDateInTimeZone = toZonedTime(
      new Date().toISOString(),
      timeZone,
    );
    const currentDateStartOfDay = startOfDay(currentDateInTimeZone);

    // Check if the current date is past the previous day of the class date
    return isAfter(currentDateStartOfDay, previousDayStart);
  } catch (error) {
    console.error("Error in isCurrentDatePastPreviousDayOfClassDate:", error);
    return false;
  }
};

// Function to check if the current date & time in a particular time zone is past the target class date & time
export const isPastClassDateTime = (
  classDateTime: string,
  timeZone: string,
): boolean => {
  try {
    const classDateTimeInZone = toZonedTime(classDateTime, timeZone);

    const currentDateTimeInZone = toZonedTime(new Date(), timeZone);

    return isAfter(currentDateTimeInZone, classDateTimeInZone);
  } catch (error) {
    console.error("Error in hasCurrentDateTimePassedTargetDateTime:", error);
    return false;
  }
};

// Function to calculate the end time of a class.
export function getEndTime(date: Date): Date {
  return new Date(date.getTime() + 25 * 60 * 1000);
}

// Function to return short form of the day of the week.
export function getWeekday(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone,
  }).format(date);
}

// Function to check if the current date & time in a particular time zone is past the target class end time
export const isPastClassEndTime = (
  classDateTime: string,
  timeZone: string,
): boolean => {
  try {
    // Convert class start time to zoned time
    const classDateTimeInZone = toZonedTime(classDateTime, timeZone);

    // Calculate the end time of the class
    const classEndTime = getEndTime(classDateTimeInZone);

    // Get the current date & time in the specified time zone
    const currentDateTimeInZone = toZonedTime(new Date(), timeZone);

    // Check if the current date & time is after the class end time
    return isAfter(currentDateTimeInZone, classEndTime);
  } catch (error) {
    console.error("Error in isPastClassEndTime:", error);
    return false;
  }
};

// Converts a date string to the format YYYY-MM-DD.
export const formatBirthdateToISO = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

// Converts a date in YYYY-MM-DD format to ISO 8601 format (YYYY-MM-DDTHH:MM:SS.sssZ).
export const formatDateToISO = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }
  return date.toISOString();
};

// e.g., Monday, Tuesday ...
export const getDayOfWeek = (dateString: string, timeZone: string): string => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone,
  });
  return formatter.format(date);
};

// e.g., JAN, FEB ...
export const getShortMonth = (dateString: string, timeZone: string): string => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone,
  });
  return formatter.format(date).toUpperCase();
};

export const getDay = (dateString: string, timeZone: string): number => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    timeZone,
  });
  return parseInt(formatter.format(date), 10);
};
