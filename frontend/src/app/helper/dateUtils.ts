// Function to format date for a given time zone
export const formatDate = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone,
  }).format(date);
};

// Function to format time for a given time zone
export const formatTime = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
};
