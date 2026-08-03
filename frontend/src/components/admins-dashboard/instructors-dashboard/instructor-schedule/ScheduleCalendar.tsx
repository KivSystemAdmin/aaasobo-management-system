import styles from "./ScheduleCalendar.module.scss";
import { InstructorSlot } from "@/lib/api/instructorsApi";
import {
  BusinessTime,
  Weekday_Ja,
  WEEKDAYS_JA,
} from "@/lib/utils/scheduleUtils";
import {
  TimeColumn,
  BaseDayColumn,
  BaseCalendarRoot,
} from "./BaseScheduleCalendar";

enum CellType {
  EMPTY = "empty",
  SCHEDULED = "scheduled",
  DISABLED = "disabled",
}

interface ScheduleCalendarProps {
  slots: InstructorSlot[];
}

export default function ScheduleCalendar({ slots }: ScheduleCalendarProps) {
  const slotsByDay = slots.reduce(
    (acc, slot) => {
      const day = WEEKDAYS_JA[slot.weekday];
      if (!acc[day]) acc[day] = [];

      acc[day].push(slot.startTime);
      return acc;
    },
    {} as Record<Weekday_Ja, string[]>,
  );

  Object.keys(slotsByDay).forEach((day) => {
    slotsByDay[day as Weekday_Ja].sort();
  });

  return (
    <BaseCalendarRoot>
      <TimeColumn />
      {WEEKDAYS_JA.map((day) => (
        <DayColumn key={day} day={day} scheduledTimes={slotsByDay[day] || []} />
      ))}
    </BaseCalendarRoot>
  );
}

function DayColumn({
  day,
  scheduledTimes,
}: {
  day: Weekday_Ja;
  scheduledTimes: string[];
}) {
  const disabledTimes = BusinessTime.getDisabledTimes(day);

  const getCellType = (time: string): CellType => {
    if (disabledTimes.includes(time)) return CellType.DISABLED;
    if (scheduledTimes.includes(time)) return CellType.SCHEDULED;
    return CellType.EMPTY;
  };

  return (
    <BaseDayColumn day={day}>
      {BusinessTime.times.map((time) => (
        <Cell key={time} cellType={getCellType(time)} />
      ))}
    </BaseDayColumn>
  );
}

function Cell({ cellType }: { cellType: CellType }) {
  const getCellClass = () => {
    switch (cellType) {
      case CellType.SCHEDULED:
        return styles.scheduledCell;
      case CellType.DISABLED:
        return styles.disabledCell;
      default:
        return styles.emptyCell;
    }
  };

  return <div className={getCellClass()} />;
}
