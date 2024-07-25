// Function to format date for a given time zone (e.g., Jun 29, 2024)
export const formatDate = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone,
  }).format(date);
};

// Function to format time for a given time zone(e.g., 19:00, 15:30)
export const formatTime = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
};

// Function to format date and time for a given time zone (e.g., Jun 29, 2024)
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
