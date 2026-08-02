import styles from "./EditableScheduleCalendar.module.scss";
import { InstructorSlot } from "@/lib/api/instructorsApi";
import {
  BusinessTime,
  Weekday,
  Weekday_Ja,
  WEEKDAYS,
  WEEKDAYS_JA,
  weekdayToDay,
} from "@/lib/utils/scheduleUtils";
import {
  TimeColumn,
  BaseDayColumn,
  BaseCalendarRoot,
} from "./BaseScheduleCalendar";

enum CellType {
  UNCHANGED = "unchanged",
  ADDED = "added",
  REMOVED = "removed",
  EMPTY = "empty",
  DISABLED = "disabled",
}

interface EditableScheduleCalendarProps {
  initialSlots: InstructorSlot[];
  editedSlots: Set<string>;
  onSlotToggle: (weekday: number, time: string) => void;
}

export default function EditableScheduleCalendar({
  initialSlots,
  editedSlots,
  onSlotToggle,
}: EditableScheduleCalendarProps) {
  // Convert initial slots to keys for comparison
  const initialKeys = new Set(
    initialSlots.map((slot) => {
      // Backend now returns clean time strings in HH:MM format
      return `${slot.weekday}-${slot.startTime}`;
    }),
  );

  // Determine slot type based on initial vs edited state
  const getCellType = (weekday: number, time: string): CellType => {
    const key = `${weekday}-${time}`;
    const inInitial = initialKeys.has(key);
    const inEdited = editedSlots.has(key);

    if (BusinessTime.getDisabledTimes(weekdayToDay(weekday)).includes(time)) {
      return CellType.DISABLED;
    }

    if (inInitial && inEdited) return CellType.UNCHANGED;
    if (!inInitial && inEdited) return CellType.ADDED;
    if (inInitial && !inEdited) return CellType.REMOVED;
    return CellType.EMPTY;
  };

  return (
    <BaseCalendarRoot>
      <TimeColumn />
      {WEEKDAYS_JA.map((day, weekday) => (
        <DayColumn
          key={day}
          day={day}
          weekday={weekday}
          getCellType={getCellType}
          onSlotToggle={onSlotToggle}
        />
      ))}
    </BaseCalendarRoot>
  );
}

function DayColumn({
  day,
  weekday,
  getCellType,
  onSlotToggle,
}: {
  day: Weekday_Ja;
  weekday: number;
  getCellType: (weekday: number, time: string) => CellType;
  onSlotToggle: (weekday: number, time: string) => void;
}) {
  return (
    <BaseDayColumn day={day}>
      {BusinessTime.times.map((time) => {
        const cellType = getCellType(weekday, time);
        return (
          <Cell
            key={time}
            time={time}
            weekday={weekday}
            cellType={cellType}
            onToggle={onSlotToggle}
          />
        );
      })}
    </BaseDayColumn>
  );
}

function Cell({
  time,
  weekday,
  cellType,
  onToggle,
}: {
  time: string;
  weekday: number;
  cellType: CellType;
  onToggle: (weekday: number, time: string) => void;
}) {
  const handleClick = () => {
    if (cellType !== CellType.DISABLED) {
      onToggle(weekday, time);
    }
  };

  const getCellClass = () => {
    switch (cellType) {
      case CellType.UNCHANGED:
        return styles.unchangedCell;
      case CellType.ADDED:
        return styles.addedCell;
      case CellType.REMOVED:
        return styles.removedCell;
      case CellType.DISABLED:
        return styles.disabledCell;
      default:
        return styles.emptyCell;
    }
  };

  return (
    <div
      className={getCellClass()}
      onClick={handleClick}
      style={{
        cursor: cellType === CellType.DISABLED ? "not-allowed" : "pointer",
      }}
    />
  );
}
