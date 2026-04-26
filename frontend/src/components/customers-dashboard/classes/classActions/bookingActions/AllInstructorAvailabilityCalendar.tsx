"use client";

import { useCallback } from "react";
import {
  getInstructorAvailableSlotsByType,
  getInstructorProfiles,
} from "@/lib/api/instructorsApi";
import type { AvailableSlot } from "@shared/schemas/instructors";
import styles from "./AllInstructorAvailabilityCalendar.module.scss";
import { EnglishBackground } from "@/types";
import AvailabilityWeekGrid, {
  AvailabilityWeekGridSlot,
} from "./AvailabilityWeekGrid";

type AvailabilityOverviewSlot = AvailabilityWeekGridSlot & {
  availableInstructorIds: number[];
};

interface AllInstructorAvailabilityCalendarProps {
  onSlotSelect: (
    dateTime: string,
    availableInstructors: InstructorRebookingProfile[],
  ) => void;
  language: "ja" | "en";
  englishBackground: EnglishBackground;
}

export default function AllInstructorAvailabilityCalendar({
  onSlotSelect,
  language,
  englishBackground,
}: AllInstructorAvailabilityCalendarProps) {
  const fetchSlots = useCallback(
    async (startDate: string, endDate: string) => {
      const response = await getInstructorAvailableSlotsByType(
        startDate,
        endDate,
        englishBackground,
      );

      if (!("data" in response)) {
        return [];
      }

      return response.data.map((slot: AvailableSlot) => ({
        dateTime: slot.dateTime,
        instructorCount: slot.availableInstructors.length,
        availableInstructorIds: slot.availableInstructors,
      }));
    },
    [englishBackground],
  );

  const handleSlotSelect = useCallback(
    async (slot: AvailabilityWeekGridSlot) => {
      const overviewSlot = slot as AvailabilityOverviewSlot;

      try {
        const allProfiles = await getInstructorProfiles();
        const availableInstructors = allProfiles.filter((profile) =>
          overviewSlot.availableInstructorIds.includes(profile.id),
        );
        onSlotSelect(slot.dateTime, availableInstructors);
      } catch (error) {
        console.error("Failed to fetch instructor profiles:", error);
        onSlotSelect(slot.dateTime, []);
      }
    },
    [onSlotSelect],
  );

  return (
    <div className={styles.container}>
      <div className={styles.calendarHeader}>
        <p>
          {language === "ja"
            ? "予約したいスロットをクリックしてください"
            : "Click on a time slot to proceed with booking"}
        </p>
      </div>

      <AvailabilityWeekGrid
        fetchSlots={fetchSlots}
        onSlotSelect={handleSlotSelect}
        language={language}
        showInstructorCount
      />
    </div>
  );
}
