"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthNumber =
  exports.calculateFirstDate =
  exports.createDatesBetween =
  exports.getFirstDateInMonths =
  exports.months =
  exports.JAPAN_TIME_DIFF =
  exports.days =
    void 0;
exports.days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
exports.JAPAN_TIME_DIFF = 9;
exports.months = [
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
function getFirstDateInMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0);
  return d;
}
exports.getFirstDateInMonths = getFirstDateInMonths;
// Generate the data between `start` and `end` dates including `end`.
function createDatesBetween(start, end) {
  const dates = [];
  while (start < end) {
    dates.push(new Date(start));
    start.setUTCDate(start.getUTCDate() + 7);
  }
  return dates;
}
exports.createDatesBetween = createDatesBetween;
const getDayNumber = (day) => {
  return exports.days.indexOf(day);
};
// Calculate the first date of `day` and `time` after `from`.
// e.g., from: "2024-08-01", day: "Mon", time: "09:00" => "2024-08-05T00:00:00Z"
function calculateFirstDate(from, day, time) {
  const date = new Date(from);
  // The following calculation for setDate works only for after 09:00 in Japanese time.
  // Japanese time is UTC+9. Thus, after 09:00, date.getUTCDay() returns the same day as in Japan.
  date.setDate(
    date.getDate() + ((getDayNumber(day) - date.getUTCDay() + 7) % 7),
  );
  const [hour, minute] = time.split(":");
  date.setUTCHours(parseInt(hour) - exports.JAPAN_TIME_DIFF);
  date.setUTCMinutes(parseInt(minute));
  return date;
}
exports.calculateFirstDate = calculateFirstDate;
const getMonthNumber = (month) => {
  return exports.months.indexOf(month);
};
exports.getMonthNumber = getMonthNumber;
