"use client";

import { useCallback } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type {
  CalendarOptions,
  EventClickArg,
  EventContentArg,
  EventSourceFuncArg,
} from "@fullcalendar/core";
import Calendar from "@/components/features/calendar/Calendar";
import { getInstructorCalendarSlots } from "@/lib/api/instructorsApi";
import type {
  InstructorCalendarSlot,
  InstructorCalendarSlotType,
} from "@shared/schemas/instructors";
import styles from "./InstructorSlotCalendar.module.scss";

type SlotCalendarEvent = {
  id: string;
  start: string;
  end: string;
  title: string;
  color: string;
  textColor: string;
  extendedProps: {
    slotType: InstructorCalendarSlotType;
    classId?: number;
  };
};

type InstructorSlotCalendarProps = {
  instructorId: number;
  getClassDetailUrl: (classId: number) => string;
  headerRight?: ReactNode;
  refreshKey?: number;
  calendarOptions?: Partial<CalendarOptions>;
};

const SLOT_LABELS: Record<InstructorCalendarSlotType, string> = {
  open: "Open",
  booked: "Booked",
  rebooked: "Booked",
  completed: "Done",
  absence: "Absent",
  canceledByInstructor: "Canceled",
};

const SLOT_SYMBOLS: Record<InstructorCalendarSlotType, string> = {
  open: "○",
  booked: "●",
  rebooked: "●",
  completed: "✓",
  absence: "−",
  canceledByInstructor: "×",
};

const CLICKABLE_SLOT_TYPES: InstructorCalendarSlotType[] = [
  "booked",
  "rebooked",
  "completed",
  "canceledByInstructor",
];

const formatJSTDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const buildSlotEvent = (slot: InstructorCalendarSlot): SlotCalendarEvent => ({
  id: `${slot.slotType}-${slot.classId ?? slot.start}`,
  start: slot.start,
  end: slot.end,
  title: slot.title,
  color: "#FFFFFF",
  textColor: "#111827",
  extendedProps: {
    slotType: slot.slotType,
    classId: slot.classId,
  },
});

export default function InstructorSlotCalendar({
  instructorId,
  getClassDetailUrl,
  headerRight,
  refreshKey = 0,
  calendarOptions,
}: InstructorSlotCalendarProps) {
  const router = useRouter();

  const fetchCalendarEvents = useCallback(
    async (info: EventSourceFuncArg) => {
      const startStr = formatJSTDate(info.start);
      const endDate = new Date(info.end);
      endDate.setDate(endDate.getDate() + 1);
      const endStr = formatJSTDate(endDate);

      try {
        const response = await getInstructorCalendarSlots(
          instructorId,
          startStr,
          endStr,
        );

        return response.data.map(buildSlotEvent);
      } catch (error) {
        console.error("Failed to fetch instructor calendar slots:", error);
        return [];
      }
    },
    [instructorId],
  );

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const { slotType, classId } = clickInfo.event.extendedProps as {
        slotType: InstructorCalendarSlotType;
        classId?: number;
      };

      if (classId && CLICKABLE_SLOT_TYPES.includes(slotType)) {
        router.push(getClassDetailUrl(classId));
      }
    },
    [getClassDetailUrl, router],
  );

  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
    const slotType = eventInfo.event.extendedProps
      .slotType as InstructorCalendarSlotType;
    const isClickable = CLICKABLE_SLOT_TYPES.includes(slotType);
    const titleText =
      eventInfo.event.title &&
      !["open", "absence"].includes(slotType) &&
      eventInfo.event.title !== SLOT_LABELS[slotType] &&
      eventInfo.event.title !== "Class"
        ? eventInfo.event.title
        : "";
    const compactLabel = titleText
      ? `${SLOT_LABELS[slotType]} - ${titleText}`
      : SLOT_LABELS[slotType];

    return (
      <div
        className={`${styles.eventBlock} ${isClickable ? styles.clickable : ""}`}
      >
        <div className={styles.eventHeader}>
          <span className={styles.statusBadge}>
            <span className={styles.statusSymbol}>
              {SLOT_SYMBOLS[slotType]}
            </span>
            {compactLabel}
          </span>
        </div>
      </div>
    );
  }, []);

  return (
    <Calendar
      key={refreshKey}
      height="auto"
      contentHeight="auto"
      events={fetchCalendarEvents}
      eventClick={handleEventClick}
      eventContent={renderEventContent}
      eventClassNames={(arg) => {
        const slotType = arg.event.extendedProps
          .slotType as InstructorCalendarSlotType;

        const classMap: Record<InstructorCalendarSlotType, string> = {
          open: styles.slotOpen,
          booked: styles.slotBooked,
          rebooked: styles.slotBooked,
          completed: styles.slotCompleted,
          canceledByInstructor: styles.slotCanceled,
          absence: styles.slotAbsent,
        };

        return [styles.calendarEvent, classMap[slotType]];
      }}
      selectable={false}
      headerRight={headerRight}
      {...calendarOptions}
    />
  );
}
