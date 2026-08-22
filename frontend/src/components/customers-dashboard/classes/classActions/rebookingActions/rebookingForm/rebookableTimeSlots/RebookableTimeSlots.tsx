"use client";

import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import styles from "./RebookableTimeSlots.module.scss";
import { useMemo } from "react";
import HorizontalScroller from "@/components/elements/horizontalScroller/HorizontalScroller";
import StepIndicator from "@/components/elements/stepIndicator/StepIndicator";
import ClassInstructor from "@/components/features/classDetail/classInstructor/ClassInstructor";
import { useCustomerTimeZone } from "@/contexts/CustomerTimeZoneContext";

const getLocalDateKey = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
};

export default function RebookableTimeSlots({
  setDateTimeToRebook,
  setRebookingStep,
  instructorToRebook,
  instructorAvailabilities,
  rebookingOption,
  language,
}: RebookableTimeSlotsProps) {
  const timeZone = useCustomerTimeZone();
  const previousRebookingStep =
    rebookingOption === "instructor" ? "selectInstructor" : "selectOption";

  const nextRebookingStep =
    rebookingOption === "instructor" ? "confirmRebooking" : "selectInstructor";

  const currentStep: number = rebookingOption === "instructor" ? 2 : 1;

  const rebookableTimeSlots = useMemo(() => {
    if (rebookingOption === "instructor") {
      return instructorAvailabilities
        .filter((a) => a.availableInstructors.includes(instructorToRebook.id))
        .map((a) => a.dateTime)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    } else if (rebookingOption === "dateTime") {
      return [
        ...new Set(
          instructorAvailabilities
            .map((a) => a.dateTime)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
        ),
      ];
    }
    return [];
  }, [instructorAvailabilities, instructorToRebook, rebookingOption]);

  const selectDateTime = (dateTime: string) => {
    setDateTimeToRebook(dateTime);
    setRebookingStep(nextRebookingStep);
  };

  const groupSlotsByDay = (slots: string[]) => {
    const grouped: Record<string, string[]> = {};

    slots.forEach((slot) => {
      const date = getLocalDateKey(new Date(slot), timeZone || "UTC");
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });
    return grouped;
  };
  const groupedSlots = groupSlotsByDay(rebookableTimeSlots);
  const weekDates = Object.keys(groupedSlots);

  if (!timeZone) return null;

  return (
    <div className={styles.rebookableSlots}>
      {instructorAvailabilities.length === 0 ? (
        <p className={styles.noInstructorMessage}>
          {language === "ja"
            ? "予約可能なクラスがありません。"
            : "No classes available for booking."}
        </p>
      ) : (
        <>
          <StepIndicator currentStep={currentStep} totalSteps={3} />

          {rebookingOption === "instructor" && (
            <ClassInstructor
              classStatus={"freeTrial"}
              instructorIcon={instructorToRebook.icon}
              instructorNickname={instructorToRebook.nickname}
              width={100}
              className="rebookingModal"
            />
          )}

          <HorizontalScroller>
            <div className={styles.scroller}>
              <div className={styles.headerRow}>
                {weekDates.map((date) => {
                  const locale = language === "ja" ? "ja-JP" : "en-US";
                  const headerDate = new Date(`${date}T00:00:00Z`);
                  const formattedDay = new Intl.DateTimeFormat(locale, {
                    weekday: "short",
                    timeZone: "UTC",
                  }).format(headerDate);
                  const formattedDate = new Intl.DateTimeFormat(locale, {
                    month: language === "ja" ? "numeric" : "short",
                    day: "numeric",
                    timeZone: "UTC",
                  }).format(headerDate);

                  return (
                    <div key={date} className={styles.dayHeader}>
                      <div className={styles.dayHeader__date}>
                        {formattedDate}
                      </div>
                      <div className={styles.dayHeader__day}>
                        {formattedDay}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.slotRow}>
                {weekDates.map((date) => (
                  <div key={date} className={styles.dayColumn}>
                    {groupedSlots[date].map((slot) => (
                      <ActionButton
                        key={slot}
                        btnText={new Intl.DateTimeFormat("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZone,
                        }).format(new Date(slot))}
                        className="timeSlotBtn"
                        onClick={() => selectDateTime(slot)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </HorizontalScroller>
        </>
      )}

      <ActionButton
        btnText={language === "ja" ? "戻る" : "Back"}
        className="back"
        onClick={() => setRebookingStep(previousRebookingStep)}
      />
    </div>
  );
}
