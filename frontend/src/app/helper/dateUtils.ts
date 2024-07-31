import { toZonedTime } from "date-fns-tz";
import { startOfDay, isAfter } from "date-fns";

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

// Function to format day and date for a given time zone (e.g., Mon, July 23, 2024)
export const formatDayDate = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "2-digit",
    timeZone,
  }).format(date);
};

const addMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date.getTime());
  result.setMinutes(result.getMinutes() + minutes);
  return result;
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
// Function to calculate the class start and end times in Philippine Time from an ISO date string
// and format the times as "YYYY-MM-DDTHH:MM:SS" to use them directly in events on the calendar
export function getPhilippineClassStartAndEndTimes(isoDateStr: string) {
  const timeZoneOffset = 8 * 60 * 60 * 1000;
  const date = new Date(isoDateStr);
  const philippineStartDate = new Date(date.getTime() + timeZoneOffset);
  const philippineEndDate = new Date(
    philippineStartDate.getTime() + 25 * 60 * 1000,
  );

  return {
    start: philippineStartDate.toISOString().replace(".000Z", ""),
    end: philippineEndDate.toISOString().replace(".000Z", ""),
  };
}

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
  date: Date,
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
