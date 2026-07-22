"use client";

import React, { useEffect, useState } from "react";
import {
  getActiveInstructorSchedule,
  InstructorSlot,
} from "@/lib/api/instructorsApi";
import { getTodayInJapanISODate } from "@/lib/utils/dateUtils";
import { WEEKDAYS } from "@/lib/utils/scheduleUtils";
import styles from "./InstructorSchedule.module.scss";

interface InstructorScheduleProps {
  instructorId: number;
  effectiveDate: string;
  onSlotSelect: (weekday: number, startTime: string) => void;
  selectedWeekday: number | null;
  selectedStartTime: string;
}

export default function InstructorSchedule({
  instructorId,
  effectiveDate,
  onSlotSelect,
  selectedWeekday,
  selectedStartTime,
}: InstructorScheduleProps) {
  const [slots, setSlots] = useState<InstructorSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      setError("");

      try {
        // Get instructor's active schedule directly
        const today = getTodayInJapanISODate();
        const response = await getActiveInstructorSchedule(
          instructorId,
          effectiveDate || today,
        );
        // Set the slots from the active schedule
        setSlots(response.schedule?.slots || []);
      } catch (error) {
        console.error("Failed to fetch instructor schedule:", error);
        setError("Failed to load instructor schedule");
      } finally {
        setLoading(false);
      }
    };

    if (instructorId) {
      fetchSchedule();
    }
  }, [instructorId, effectiveDate]);

  // Group JST slots by weekday
  const slotsByWeekday = (slots || []).reduce(
    (acc, slot) => {
      if (!acc[slot.weekday]) {
        acc[slot.weekday] = [];
      }

      // Display JST times directly
      acc[slot.weekday].push({
        displayTime: slot.startTime,
        originalWeekday: slot.weekday,
        originalTime: slot.startTime,
      });

      return acc;
    },
    {} as Record<
      number,
      Array<{
        displayTime: string;
        originalWeekday: number;
        originalTime: string;
      }>
    >,
  );

  // Sort times for each day
  Object.keys(slotsByWeekday).forEach((weekday) => {
    slotsByWeekday[parseInt(weekday)].sort((a, b) =>
      a.displayTime.localeCompare(b.displayTime),
    );
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <span>Loading instructor schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span>{error}</span>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <span>
          No available time slots found for this instructor on the selected
          date.
        </span>
      </div>
    );
  }

  return (
    <div className={styles.scheduleContainer}>
      <div className={styles.calendar}>
        {/* Header with weekday names */}
        <div className={styles.header}>
          {WEEKDAYS.map((day, index) => (
            <div key={day} className={styles.dayHeader}>
              {day}
            </div>
          ))}
        </div>

        {/* Time slots grid */}
        <div className={styles.slotsGrid}>
          {WEEKDAYS.map((day, weekdayIndex) => (
            <div key={day} className={styles.dayColumn}>
              {slotsByWeekday[weekdayIndex]?.map((slotInfo) => (
                <button
                  key={`${weekdayIndex}-${slotInfo.displayTime}`}
                  type="button"
                  className={`${styles.timeSlot} ${
                    selectedWeekday === slotInfo.originalWeekday &&
                    selectedStartTime === slotInfo.originalTime
                      ? styles.selected
                      : ""
                  }`}
                  onClick={() =>
                    onSlotSelect(
                      slotInfo.originalWeekday,
                      slotInfo.originalTime,
                    )
                  }
                >
                  {slotInfo.displayTime}
                </button>
              )) || <div className={styles.noSlots}>No slots</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
