"use client";

import { useState, useCallback } from "react";
import {
  getInstructorAvailableSlotsByType,
  getInstructorProfiles,
} from "@/lib/api/instructorsApi";
import type { AvailableSlot } from "@shared/schemas/instructors";
import Calendar from "@/components/features/calendar/Calendar";
import { EventSourceFuncArg, EventClickArg } from "@fullcalendar/core";
import styles from "./AllInstructorAvailabilityCalendar.module.scss";
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
    availableInstructorIds: number[];
    instructorCount: number;
  };
}

interface AllInstructorAvailabilityCalendarProps {
  onSlotSelect: (
    dateTime: string,
    availableInstructors: InstructorRebookingProfile[],
  ) => void;
  language: "ja" | "en";
  englishBackground: EnglishBackground;
}

// Helper function to format date for API calls
const formatJSTDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// Helper function to create calendar event from slot data
const createCalendarEvent = (
  slot: AvailableSlot,
  language: "ja" | "en",
): CalendarEvent => {
  const start = slot.dateTime;
  const end = new Date(new Date(start).getTime() + 25 * 60000).toISOString();

  const instructorCount = slot.availableInstructors.length;
  const title =
    language === "ja"
      ? `講師${instructorCount}名`
      : `${instructorCount} instructors`;

  return {
    id: `available-${start}`,
    start,
    end,
    title,
    color: greenSuccess,
    textColor: "#FFF",
    extendedProps: {
      type: "available" as const,
      availableInstructorIds: slot.availableInstructors,
      instructorCount,
    },
  };
};

// Helper function to get error message based on language
const getErrorMessage = (language: "ja" | "en"): string => {
  return language === "ja"
    ? "スケジュールの読み込みに失敗しました"
    : "Failed to load schedule";
};

export default function AllInstructorAvailabilityCalendar({
  onSlotSelect,
  language,
  englishBackground,
}: AllInstructorAvailabilityCalendarProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCalendarEvents = useCallback(
    async (info: EventSourceFuncArg) => {
      const startStr = formatJSTDate(info.start);
      const exclusiveEnd = new Date(info.end);
      exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
      const endStr = formatJSTDate(exclusiveEnd);

      try {
        setErrorMessage(null);
        const response = await getInstructorAvailableSlotsByType(
          startStr,
          endStr,
          englishBackground,
        );

        if ("data" in response) {
          return response.data.map((slot: AvailableSlot) =>
            createCalendarEvent(slot, language),
          );
        }

        return [];
      } catch (error) {
        console.error("Failed to fetch calendar data:", error);
        setErrorMessage(getErrorMessage(language));
        return [];
      }
    },
    [language, englishBackground],
  );

  const handleSlotClick = useCallback(
    async (clickInfo: EventClickArg) => {
      const eventType = clickInfo.event.extendedProps.type;

      if (eventType !== "available") {
        return;
      }

      const dateTime = clickInfo.event.start!.toISOString();
      const instructorIds =
        clickInfo.event.extendedProps.availableInstructorIds;

      try {
        const allProfiles = await getInstructorProfiles();
        const availableInstructors = allProfiles.filter((profile) =>
          instructorIds.includes(profile.id),
        );
        onSlotSelect(dateTime, availableInstructors);
      } catch (error) {
        console.error("Failed to fetch instructor profiles:", error);
        onSlotSelect(dateTime, []);
      }
    },
    [onSlotSelect],
  );

  return (
    <div className={styles.container}>
      <div className={styles.calendarHeader}>
        <h3>
          {language === "ja"
            ? "空きスケジュール一覧"
            : "Available Schedule Overview"}
        </h3>
        <p>
          {language === "ja"
            ? "予約したいスロットをクリックしてください"
            : "Click on a time slot to proceed with booking"}
        </p>
      </div>

      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}

      <div className={styles.calendarShell}>
        <Calendar
          height="500px"
          contentHeight="400px"
          key={refreshKey}
          events={fetchCalendarEvents}
          eventClick={handleSlotClick}
          selectable={false}
          displayEventTime={false}
        />
      </div>
    </div>
  );
}
