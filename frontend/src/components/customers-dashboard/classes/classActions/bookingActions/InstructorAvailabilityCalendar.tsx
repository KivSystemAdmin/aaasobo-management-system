"use client";

import { useCallback } from "react";
import { getInstructorAvailableSlots } from "@/lib/api/instructorsApi";
import styles from "./InstructorAvailabilityCalendar.module.scss";
import { EnglishBackground } from "@/types";
import AvailabilityWeekGrid, {
  AvailabilityWeekGridSlot,
} from "./AvailabilityWeekGrid";

interface InstructorAvailabilityCalendarProps {
  instructorId: number;
  instructorName: string;
  onSlotSelect: (
    dateTime: string,
    instructor: InstructorRebookingProfile,
  ) => void;
  language: "ja" | "en";
}

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
  const fetchSlots = useCallback(
    async (startDate: string, endDate: string) => {
      const slotsResponse = await getInstructorAvailableSlots(
        instructorId,
        startDate,
        endDate,
        true,
      );

      if (!("data" in slotsResponse)) {
        return [];
      }

      return slotsResponse.data.map((slot) => ({
        dateTime: slot.dateTime,
      }));
    },
    [instructorId],
  );

  const handleSlotSelect = useCallback(
    (slot: AvailabilityWeekGridSlot) => {
      const instructor = createInstructorProfile(instructorId, instructorName);
      onSlotSelect(slot.dateTime, instructor);
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

      <AvailabilityWeekGrid
        fetchSlots={fetchSlots}
        onSlotSelect={handleSlotSelect}
        language={language}
      />
    </div>
  );
}
