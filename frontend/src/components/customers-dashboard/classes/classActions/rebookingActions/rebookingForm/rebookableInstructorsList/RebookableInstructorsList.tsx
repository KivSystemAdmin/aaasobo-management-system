"use client";

import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import styles from "./RebookableInstructorsList.module.scss";
import {
  formatTimeWithAddedMinutes,
  formatYearDateTime,
} from "@/lib/utils/dateUtils";
import { useMemo } from "react";
import StepIndicator from "@/components/elements/stepIndicator/StepIndicator";
import RebookableInstructorItem from "./rebookableInstructorItem/RebookableInstructorItem";
import { CalendarDaysIcon } from "@heroicons/react/24/solid";

export default function RebookableInstructorsList({
  instructorProfiles,
  instructorAvailabilities,
  setInstructorToRebook,
  englishBackgroundArray,
  rebookingOption,
  setRebookingStep,
  dateTimeToRebook,
  language,
  adminId,
  customerId,
}: RebookableInstructorsListProps) {
  const previousRebookingStep =
    rebookingOption === "instructor" ? "selectOption" : "selectDateTime";

  const nextRebookingStep =
    rebookingOption === "instructor" ? "selectDateTime" : "confirmRebooking";

  const currentStep: number = rebookingOption === "instructor" ? 1 : 2;

  const rebookableInstructorIds = useMemo(() => {
    if (rebookingOption === "instructor") {
      return [
        ...new Set(
          instructorAvailabilities.flatMap((a) => a.availableInstructors),
        ),
      ];
    }
    if (rebookingOption === "dateTime") {
      return instructorAvailabilities
        .filter((a) => a.dateTime === dateTimeToRebook)
        .flatMap((a) => a.availableInstructors);
    }
    return [];
  }, [rebookingOption, instructorAvailabilities, dateTimeToRebook]);

  const selectInstructor = (instructor: InstructorRebookingProfile) => {
    setInstructorToRebook(instructor);
    setRebookingStep(nextRebookingStep);
  };

  return (
    <div className={styles.rebookableInstructors}>
      <StepIndicator currentStep={currentStep} totalSteps={3} />

      {rebookingOption === "dateTime" && (
        <div className={styles.rebookableInstructors__dateTime}>
          <CalendarDaysIcon className={styles.rebookableInstructors__icon} />
          {`${formatYearDateTime(
            new Date(dateTimeToRebook!),
            language === "ja" ? "ja-JP" : "en-US",
          )} - 
          ${formatTimeWithAddedMinutes(new Date(dateTimeToRebook!), 25)}`}
        </div>
      )}
      <div className={styles.rebookableInstructors__list}>
        {instructorProfiles
          // Filter instructors based on the English background array
          .filter((instructor) =>
            englishBackgroundArray.includes(instructor.englishBackground),
          )
          .map((instructor) => {
            const isRebookable = rebookableInstructorIds.includes(
              instructor.id,
            );
            return (
              <RebookableInstructorItem
                key={instructor.id}
                instructor={instructor}
                isRebookable={isRebookable}
                language={language}
                adminId={adminId}
                customerId={customerId}
                onSelect={selectInstructor}
              />
            );
          })}
      </div>

      <ActionButton
        btnText={language === "ja" ? "戻る" : "Back"}
        className="back"
        onClick={() => setRebookingStep(previousRebookingStep)}
      />
    </div>
  );
}
