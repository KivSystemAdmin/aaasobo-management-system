export type Weekday = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export type Weekday_Ja = "日" | "月" | "火" | "水" | "木" | "金" | "土";

export const WEEKDAYS: Weekday[] = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export const WEEKDAYS_JA: Weekday_Ja[] = [
  "日",
  "月",
  "火",
  "水",
  "木",
  "金",
  "土",
];

export const weekdayToDay = (weekday: number): Weekday => WEEKDAYS[weekday];

export class BusinessTime {
  public static getDisabledTimes = (day: Weekday | Weekday_Ja) => {
    switch (day) {
      case "Sun":
        return BusinessTime.sundayDisabledTimes;
      case "Sat":
        return BusinessTime.saturdayDisabledTimes;
      case "日":
        return BusinessTime.sundayDisabledTimes;
      case "土":
        return BusinessTime.saturdayDisabledTimes;
      default:
        return BusinessTime.weekdayDisabledTimes;
    }
  };

  private static createSlots = (hours: string[]) => {
    const minutes = ["00", "30"];
    return hours
      .map((hour) => minutes.map((minute) => `${hour}:${minute}`))
      .flat();
  };

  public static readonly times = BusinessTime.createSlots([
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
  ]);

  private static readonly weekdayDisabledTimes = BusinessTime.createSlots([
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
  ]);

  private static readonly saturdayDisabledTimes = BusinessTime.createSlots([
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
  ]);

  private static readonly sundayDisabledTimes = BusinessTime.times;
}

export const slotToKey = (weekday: number, startTime: string): string =>
  `${weekday}-${startTime}`;

export const keyToSlot = (
  key: string,
): { weekday: number; startTime: string } => {
  const [weekday, startTime] = key.split("-");
  return { weekday: parseInt(weekday), startTime };
};
