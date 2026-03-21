"use client";

import { useState } from "react";
import styles from "./RebookingForm.module.scss";
import RebookingOptions from "./rebookingOptions/RebookingOptions";
import RebookableInstructorsList from "./rebookableInstructorsList/RebookableInstructorsList";
import RebookableTimeSlots from "./rebookableTimeSlots/RebookableTimeSlots";
import ConfirmRebooking from "./confirmRebooking/ConfirmRebooking";
import RebookableClassesList from "./rebookableClassesList/RebookableClassesList";
import { getAllInstructorAvailableSlots } from "@/lib/api/instructorsApi";
import Loading from "@/components/elements/loading/Loading";
import RebookingCompleteMessage from "./rebookingCompleteMessage/RebookingCompleteMessage";
import { useLanguage } from "@/contexts/LanguageContext";
import { nHoursLater } from "@/lib/utils/dateUtils";
import { EnglishBackground } from "@/types";

export default function RebookingForm({
  customerId,
  rebookableClasses,
  instructorProfiles,
  childProfiles,
  userSessionType,
}: RebookingFormProps) {
  const [instructorAvailabilities, setInstructorAvailabilities] = useState<
    { dateTime: string; availableInstructors: number[] }[] | []
  >([]);
  const [rebookingStep, setRebookingStep] =
    useState<RebookingSteps>("selectClass");
  const [rebookingOption, setRebookingOption] = useState<
    "instructor" | "dateTime" | null
  >(null);
  const [classToRebook, setClassToRebook] = useState<number | null>(null);
  const [instructorToRebook, setInstructorToRebook] =
    useState<InstructorRebookingProfile | null>(null);
  const [dateTimeToRebook, setDateTimeToRebook] = useState<string | null>(null);
  const [rebookableClassesNumber, setRebookableClassesNumber] =
    useState<number>(0);
  const [englishBackgroundArray, setEnglishBackgroundArray] = useState<
    EnglishBackground[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const { language } = useLanguage();

  const handleRebookableClassSelect = async (classId: number) => {
    const selectedClass = rebookableClasses.find(
      (classItem) => classItem.id === classId,
    );
    const englishBackground =
      selectedClass?.subscription?.plan?.englishBackground;
    const englishBackgroundOrdered = [
      EnglishBackground.NonNative,
      EnglishBackground.NativeA,
      EnglishBackground.NativeB,
    ];
    setEnglishBackgroundArray(
      englishBackgroundOrdered.slice(0, englishBackground + 1),
    );
    setClassToRebook(classId);
    setRebookingStep("selectOption");
    setIsLoading(true);

    try {
      // Get date range for next 30 days for rebooking
      const REGULAR_REBOOKING_HOURS = 3;
      const INSTRUCTOR_AVAILABILITY_WINDOW_HOURS = 30 * 24;
      const startDate = nHoursLater(REGULAR_REBOOKING_HOURS);
      const endDate = nHoursLater(INSTRUCTOR_AVAILABILITY_WINDOW_HOURS);

      const result = await getAllInstructorAvailableSlots(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
        englishBackground,
      );

      if ("data" in result) {
        setInstructorAvailabilities(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectOption = (option: "instructor" | "dateTime") => {
    setRebookingOption(option);
    const rebookingStep =
      option === "instructor" ? "selectInstructor" : "selectDateTime";
    setRebookingStep(rebookingStep);
  };

  return (
    <div className={styles.rebookingForm}>
      <div className={styles.loadingWrapper}>
        {isLoading && <Loading className="rebooking" />}
      </div>

      {rebookingStep === "selectClass" && (
        <RebookableClassesList
          customerId={customerId}
          rebookableClasses={rebookableClasses}
          onRebookableClassSelect={handleRebookableClassSelect}
          language={language}
          userSessionType={userSessionType}
          childProfiles={childProfiles}
        />
      )}

      {rebookingStep === "selectOption" && (
        <RebookingOptions
          selectOption={selectOption}
          setRebookingStep={setRebookingStep}
          language={language}
        />
      )}

      {rebookingStep === "selectInstructor" && (
        <RebookableInstructorsList
          instructorProfiles={instructorProfiles}
          instructorAvailabilities={instructorAvailabilities}
          setInstructorToRebook={setInstructorToRebook}
          englishBackgroundArray={englishBackgroundArray}
          rebookingOption={rebookingOption!}
          setRebookingStep={setRebookingStep}
          dateTimeToRebook={dateTimeToRebook}
          language={language}
        />
      )}

      {rebookingStep === "selectDateTime" && (
        <RebookableTimeSlots
          setDateTimeToRebook={setDateTimeToRebook}
          setRebookingStep={setRebookingStep}
          instructorToRebook={instructorToRebook!}
          instructorAvailabilities={instructorAvailabilities}
          rebookingOption={rebookingOption!}
          language={language}
        />
      )}

      {rebookingStep === "confirmRebooking" && (
        <ConfirmRebooking
          key={`${classToRebook ?? "class"}-${dateTimeToRebook ?? "time"}`}
          instructorToRebook={instructorToRebook!}
          dateTimeToRebook={dateTimeToRebook!}
          rebookingOption={rebookingOption!}
          setRebookingStep={setRebookingStep}
          childProfiles={childProfiles}
          customerId={customerId}
          rebookableClasses={rebookableClasses}
          setRebookableClassesNumber={setRebookableClassesNumber}
          classId={classToRebook!}
          userSessionType={userSessionType}
          language={language}
        />
      )}

      {rebookingStep === "complete" && (
        <RebookingCompleteMessage
          rebookableClassesNumber={rebookableClassesNumber}
          setRebookingStep={setRebookingStep}
          language={language}
        />
      )}
    </div>
  );
}
