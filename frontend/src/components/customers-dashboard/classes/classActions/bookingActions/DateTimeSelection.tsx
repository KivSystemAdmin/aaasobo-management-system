"use client";

import styles from "./DateTimeSelection.module.scss";
import InstructorAvailabilityCalendar from "./InstructorAvailabilityCalendar";
import AllInstructorAvailabilityCalendar from "./AllInstructorAvailabilityCalendar";
import { EnglishBackground } from "@/types";

interface DateTimeSelectionProps {
  onSlotSelect: (
    dateTime: string,
    availableInstructors: InstructorRebookingProfile[],
  ) => void;
  language: LanguageType;
  selectedInstructor?: InstructorRebookingProfile | null; // For instructor-first flow
  englishBackground: EnglishBackground; // For filtering in date-first flow
}

export default function DateTimeSelection({
  onSlotSelect,
  language,
  selectedInstructor,
  englishBackground,
}: DateTimeSelectionProps) {
  const handleSlotSelect = (
    dateTime: string,
    availableInstructors: InstructorRebookingProfile[],
  ) => {
    onSlotSelect(dateTime, availableInstructors);
  };

  const handleInstructorSlotSelect = (
    dateTime: string,
    instructor: InstructorRebookingProfile,
  ) => {
    onSlotSelect(dateTime, [instructor]);
  };

  return (
    <div className={styles.dateTimeSelection}>
      {/* For instructor-first flow, show instructor-specific calendar */}
      {selectedInstructor ? (
        <InstructorAvailabilityCalendar
          instructorId={selectedInstructor.id}
          instructorName={selectedInstructor.nickname}
          onSlotSelect={handleInstructorSlotSelect}
          language={language}
        />
      ) : (
        /* For date-first flow, show full calendar with all instructor availability */
        <AllInstructorAvailabilityCalendar
          onSlotSelect={handleSlotSelect}
          englishBackground={englishBackground}
          language={language}
        />
      )}
    </div>
  );
}
