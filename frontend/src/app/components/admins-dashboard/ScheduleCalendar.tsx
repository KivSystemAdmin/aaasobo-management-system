import styles from "./ScheduleCalendar.module.scss";

type Day = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export type SlotsOfDays = {
  // time must be in 24 format: "HH:MM"
  [day in Day]: string[];
};

export default function ScheduleCalendar({
  slotsOfDays,
  setSlotsOfDays,
}: {
  slotsOfDays: SlotsOfDays;
  setSlotsOfDays: (state: SlotsOfDays) => void;
}) {
  const days: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const toggleCell = (day: Day, time: string) => {
    const set = new Set(slotsOfDays[day]);
    if (set.has(time)) {
      set.delete(time);
    } else {
      set.add(time);
    }
    setSlotsOfDays({ ...slotsOfDays, [day]: Array.from(set) });
  };

  return (
    <div className={styles.root}>
      <TimeColumn />
      {days.map((day) => (
        <DayColumn
          key={day}
          day={day}
          selectedCells={slotsOfDays[day]}
          onClickCell={toggleCell}
        />
      ))}
    </div>
  );
}

// A column that shows the business times.
function TimeColumn() {
  return (
    <div className={styles.timeColumn}>
      <p>Time</p>
      {BusinessTime.times.map((time) => (
        <div key={time} className={styles.time}>
          {time}
        </div>
      ))}
    </div>
  );
}

// A column for each day of the week.
function DayColumn({
  day,
  selectedCells,
  onClickCell,
}: {
  day: Day;
  selectedCells: string[];
  onClickCell: (day: Day, time: string) => void;
}) {
  const disabledTimes = BusinessTime.getDisabledTimes(day);

  return (
    <div>
      <p>{day}</p>
      <div className={styles.column}>
        {BusinessTime.times.map((time) => {
          if (disabledTimes.includes(time)) {
            return <Cell.Disabled key={time} />;
          }
          if (selectedCells.includes(time)) {
            return (
              <Cell.Selected
                key={time}
                time={time}
                onClick={(_) => onClickCell(day, time)}
              />
            );
          }
          return (
            <Cell.Empty
              key={time}
              time={time}
              onClick={(_) => onClickCell(day, time)}
            />
          );
        })}
      </div>
    </div>
  );
}

class BusinessTime {
  public static getDisabledTimes = (day: Day) => {
    switch (day) {
      case "Sun":
        return BusinessTime.sundayDisabledTimes;
      case "Sat":
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

  // 09:00 - 20:30
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

  // 09:00 - 15:30
  private static readonly weekdayDisabledTimes = BusinessTime.createSlots([
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
  ]);

  // 12:30 - 21:30
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

  // 09:00 - 20:30
  private static readonly sundayDisabledTimes = BusinessTime.times;
}

module Cell {
  type Props = {
    time: string;
    onClick: (time: string) => void;
  };

  export function Empty({ time, onClick: toggle }: Props) {
    return (
      <div className={styles.emptyCell} onClick={(_) => toggle(time)}></div>
    );
  }

  export function Selected({ time, onClick: toggle }: Props) {
    return (
      <div className={styles.selectedCell} onClick={(_) => toggle(time)}></div>
    );
  }

  export function Disabled() {
    return <div className={styles.disabledCell}></div>;
  }
}
