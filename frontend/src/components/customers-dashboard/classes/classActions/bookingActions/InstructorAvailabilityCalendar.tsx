"use client";

import { useState, useCallback } from "react";
import { getInstructorAvailableSlots } from "@/lib/api/instructorsApi";
import Calendar from "@/components/features/calendar/Calendar";
import { EventSourceFuncArg, EventClickArg } from "@fullcalendar/core";
import styles from "./InstructorAvailabilityCalendar.module.scss";
import { greenSuccess } from "@/styles/colors";
import { EnglishBackground } from "@/types";

interface CalendarEvent {
  id: string;
  start: string;
  end: string;
  title: string;
  color: string;
  textColor: string;
  extendedProps: {
    type: "available";
    instructorId: number;
    instructorName: string;
  };
}

interface InstructorAvailabilityCalendarProps {
  instructorId: number;
  instructorName: string;
  onSlotSelect: (
    dateTime: string,
    instructor: InstructorRebookingProfile,
  ) => void;
  language: "ja" | "en";
}

// Helper function to format date for API calls
const formatJSTDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to create calendar event from slot data
const createAvailableSlotEvent = (
  slot: any,
  language: "ja" | "en",
  instructorId: number,
  instructorName: string,
): CalendarEvent => {
  const start = slot.dateTime;
  const end = new Date(new Date(start).getTime() + 25 * 60000).toISOString();

  return {
    id: `available-${start}`,
    start,
    end,
    title: language === "ja" ? "予約可能" : "Available",
    color: greenSuccess,
    textColor: "#FFF",
    extendedProps: {
      type: "available" as const,
      instructorId,
      instructorName,
    },
  };
};

// Helper function to create instructor profile object
const createInstructorProfile = (
  instructorId: number,
  instructorName: string,
): InstructorRebookingProfile => ({
  id: instructorId,
  name: instructorName,
  nickname: instructorName,
  icon: "",
  englishBackground: EnglishBackground.NonNative,
});

export default function InstructorAvailabilityCalendar({
  instructorId,
  instructorName,
  onSlotSelect,
  language,
}: InstructorAvailabilityCalendarProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCalendarEvents = useCallback(
    async (info: EventSourceFuncArg) => {
      const startStr = formatJSTDate(info.start);
      const endDate = new Date(info.end);
      endDate.setDate(endDate.getDate() + 1);
      const endStr = formatJSTDate(endDate);

      try {
        const slotsResponse = await getInstructorAvailableSlots(
          instructorId,
          startStr,
          endStr,
          true, // Exclude booked slots for customer booking
        );

        if ("data" in slotsResponse) {
          return slotsResponse.data.map((slot: any) =>
            createAvailableSlotEvent(
              slot,
              language,
              instructorId,
              instructorName,
            ),
          );
        }

        return [];
      } catch (error) {
        console.error("Failed to fetch calendar data:", error);
        return [];
      }
    },
    [instructorId, instructorName, language],
  );

  const handleSlotClick = useCallback(
    (clickInfo: EventClickArg) => {
      const eventType = clickInfo.event.extendedProps.type;

      if (eventType !== "available") {
        return;
      }

      const dateTime = clickInfo.event.start!.toISOString();
      const instructor = createInstructorProfile(instructorId, instructorName);
      onSlotSelect(dateTime, instructor);
    },
    [instructorId, instructorName, onSlotSelect],
  );

  return (
    <div className={styles.container}>
      <div className={styles.calendarHeader}>
        <h3>
          {language === "ja"
            ? `${instructorName}の空きスケジュール`
            : `${instructorName}'s Available Schedule`}
        </h3>
        <p>
          {language === "ja"
            ? "予約したいスロットをクリックしてください"
            : "Click on a time slot to book"}
        </p>
      </div>

      <div className={styles.calendarShell}>
        <Calendar
          height="500px"
          contentHeight="400px"
          key={refreshKey}
          events={fetchCalendarEvents}
          eventClick={handleSlotClick}
          selectable={false}
        />
      </div>
    </div>
  );
}
