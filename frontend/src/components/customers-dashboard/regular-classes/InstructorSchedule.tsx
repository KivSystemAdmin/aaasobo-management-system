"use client";

import React, { useEffect, useState } from "react";
import {
  getAdminInstructorAvailableSlots,
  InstructorSlot,
} from "@/lib/api/instructorsApi";
import { getTodayInJapanISODate } from "@/lib/utils/dateUtils";
import { WEEKDAYS } from "@/lib/utils/scheduleUtils";
import { EDIT_REGULAR_CLASS_MESSAGES } from "@/lib/messages/customerDashboard";
import styles from "./InstructorSchedule.module.scss";
import { useCustomerTimeZone } from "@/contexts/CustomerTimeZoneContext";

interface InstructorScheduleProps {
  instructorId: number;
  effectiveDate: string;
  onSlotSelect: (
    weekday: number,
    startTime: string,
    displayWeekday: number,
    displayTime: string,
  ) => void;
  selectedWeekday: number | null;
  selectedStartTime: string;
  language: LanguageType;
}

export default function InstructorSchedule({
  instructorId,
  effectiveDate,
  onSlotSelect,
  selectedWeekday,
  selectedStartTime,
  language,
}: InstructorScheduleProps) {
  const messages = EDIT_REGULAR_CLASS_MESSAGES[language];
  const timeZone = useCustomerTimeZone();
  const [slots, setSlots] = useState<
    Array<InstructorSlot & { dateTime: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      setError("");

      try {
        const today = getTodayInJapanISODate();
        const start = effectiveDate || today;
        const endDate = new Date(`${start}T00:00:00+09:00`);
        endDate.setDate(endDate.getDate() + 7);
        const end = endDate.toLocaleDateString("sv-SE", {
          timeZone: "Asia/Tokyo",
        });
        const response = await getAdminInstructorAvailableSlots(
          instructorId,
          start,
          end,
          true,
        );
        const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        setSlots(
          response.data.map((slot) => {
            const date = new Date(slot.dateTime);
            const weekdayName = new Intl.DateTimeFormat("en-US", {
              weekday: "short",
              timeZone: "Asia/Tokyo",
            }).format(date);
            return {
              scheduleId: 0,
              weekday: weekdayNames.indexOf(weekdayName),
              startTime: new Intl.DateTimeFormat("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Tokyo",
              }).format(date),
              dateTime: slot.dateTime,
            };
          }),
        );
      } catch (error) {
        console.error("Failed to fetch instructor schedule:", error);
        setError(messages.scheduleLoadFailed);
      } finally {
        setLoading(false);
      }
    };

    if (instructorId) {
      fetchSchedule();
    }
  }, [instructorId, effectiveDate, messages.scheduleLoadFailed]);

  if (!timeZone) return null;

  // Display each instant locally while retaining its original JST API values.
  const slotsByWeekday = (slots || []).reduce(
    (acc, slot) => {
      const slotDate = new Date(slot.dateTime);
      const localWeekdayName = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone,
      }).format(slotDate);
      const localWeekday = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
      ].indexOf(localWeekdayName);
      if (!acc[localWeekday]) {
        acc[localWeekday] = [];
      }

      acc[localWeekday].push({
        displayTime: new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone,
        }).format(slotDate),
        displayWeekday: localWeekday,
        originalWeekday: slot.weekday,
        originalTime: slot.startTime,
      });

      return acc;
    },
    {} as Record<
      number,
      Array<{
        displayTime: string;
        displayWeekday: number;
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
        <span>{messages.loadingSchedule}</span>
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
        <span>{messages.noAvailableSlots}</span>
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
              {messages.weekdays[index]}
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
                      slotInfo.displayWeekday,
                      slotInfo.displayTime,
                    )
                  }
                >
                  {slotInfo.displayTime}
                </button>
              )) || <div className={styles.noSlots}>{messages.noSlots}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
