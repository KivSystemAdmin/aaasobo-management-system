"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./ProgressiveBookingFlow.module.scss";
import ModeSelection from "./ModeSelection";
import InstructorSelection from "./InstructorSelection";
import DateTimeSelection from "./DateTimeSelection";
import ChildCheckbox from "./ChildCheckbox";
import { UsersIcon } from "@heroicons/react/24/solid";
import { checkChildConflicts, checkDoubleBooking } from "@/lib/api/classesApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert, errorAlert, warningAlert } from "@/lib/utils/alertUtils";
import { EnglishBackground } from "@/types";
import { rebookClassWithValidation } from "@/app/actions/rebooking";
import {
  CONFIRM_BOOKING_WITH_CONFLICT_MESSAGE,
  DOUBLE_BOOKING_CONFIRMATION_MESSAGE,
  LOGIN_REQUIRED_MESSAGE,
  SELECT_AT_LEAST_ONE_CHILD_MESSAGE,
} from "@/lib/messages/customerDashboard";

interface ProgressiveBookingFlowProps {
  classId: number;
  isFreeTrial: boolean;
  language: LanguageType;
  onClose: () => void;
  classCode?: string;
  adminId?: number;
  childProfiles: Child[];
  customerId: number;
  plan?: Plan;
}

type StepStatus = "completed" | "current" | "pending";

interface StepState {
  mode: StepStatus;
  instructor: StepStatus;
  datetime: StepStatus;
  confirmation: StepStatus;
}

export default function ProgressiveBookingFlow({
  classId,
  isFreeTrial,
  language,
  onClose,
  classCode,
  childProfiles,
  customerId,
  adminId,
  plan,
}: ProgressiveBookingFlowProps) {
  // All hooks must be called at the top level
  const [selectedMode, setSelectedMode] = useState<
    "instructor" | "datetime" | null
  >(null);
  const [selectedInstructor, setSelectedInstructor] =
    useState<InstructorRebookingProfile | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
  const [availableInstructors, setAvailableInstructors] = useState<
    InstructorRebookingProfile[]
  >([]);
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<number[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  const [stepStatus, setStepStatus] = useState<StepState>({
    mode: "current",
    instructor: "pending",
    datetime: "pending",
    confirmation: "pending",
  });

  // Initialize with all children selected by default
  useEffect(() => {
    if (childProfiles.length > 0) {
      const initialIds = childProfiles.map((child) => child.id);
      setSelectedChildrenIds(initialIds);
    } else {
      setSelectedChildrenIds([]);
    }
  }, [childProfiles]);

  const handleModeSelect = useCallback((mode: "instructor" | "datetime") => {
    setSelectedMode(mode);
    setStepStatus({
      mode: "completed",
      instructor: mode === "instructor" ? "current" : "pending",
      datetime: mode === "datetime" ? "current" : "pending",
      confirmation: "pending",
    });
  }, []);

  const handleInstructorSelect = useCallback(
    (instructor: InstructorRebookingProfile) => {
      setSelectedInstructor(instructor);
      setStepStatus((prev) => ({
        ...prev,
        instructor: "completed",
        datetime: "current",
      }));
    },
    [],
  );

  const handleSlotSelect = useCallback(
    (dateTime: string, instructors: InstructorRebookingProfile[]) => {
      setSelectedDateTime(dateTime);
      setAvailableInstructors(instructors);

      if (selectedMode === "datetime") {
        // Date-first flow: proceed to instructor selection
        setStepStatus((prev) => ({
          ...prev,
          datetime: "completed",
          instructor: "current",
        }));
      } else {
        // Instructor-first flow: proceed to confirmation
        setStepStatus((prev) => ({
          ...prev,
          datetime: "completed",
          confirmation: "current",
        }));
      }
    },
    [selectedMode],
  );

  const handleInstructorSelectFromDateTime = useCallback(
    (instructor: InstructorRebookingProfile) => {
      setSelectedInstructor(instructor);
      setStepStatus((prev) => ({
        ...prev,
        instructor: "completed",
        confirmation: "current",
      }));
    },
    [],
  );

  const handleChangeMode = () => {
    setSelectedMode(null);
    setSelectedInstructor(null);
    setSelectedDateTime(null);
    setAvailableInstructors([]);
    setStepStatus({
      mode: "current",
      instructor: "pending",
      datetime: "pending",
      confirmation: "pending",
    });
  };

  const handleChangeInstructor = () => {
    setSelectedInstructor(null);
    setStepStatus((prev) => ({
      ...prev,
      instructor: "current",
      datetime: selectedMode === "instructor" ? "pending" : prev.datetime,
      confirmation: "pending",
    }));
  };

  const handleChangeDateTime = () => {
    setSelectedDateTime(null);
    setAvailableInstructors([]);
    setStepStatus((prev) => ({
      ...prev,
      datetime: "current",
      instructor: selectedMode === "datetime" ? "pending" : prev.instructor,
      confirmation: "pending",
    }));
  };

  const handleChildChange = useCallback((changedChildId: number) => {
    setSelectedChildrenIds((prev: number[]) => {
      const updated = prev.filter((id) => id !== changedChildId);
      if (updated.length === prev.length) {
        updated.push(changedChildId);
      }
      return updated;
    });
  }, []);

  // Early return if no child profiles are available
  if (childProfiles.length === 0) {
    return (
      <div className={styles.progressiveFlow}>
        <div className={styles.modalHeader}>
          <h2>
            {language === "ja"
              ? "プロフィールが見つかりません"
              : "No Profiles Found"}
          </h2>
        </div>
        <div className={styles.sectionsContainer}>
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>
              {language === "ja"
                ? "予約をするには、まず子供のプロフィールを作成してください。"
                : "Please create child profiles before making a booking."}
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {language === "ja" ? "閉じる" : "Close"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleConfirmBooking = async () => {
    if (!selectedInstructor || !selectedDateTime) {
      warningAlert(
        language === "ja"
          ? "必要な項目をすべて選択してください"
          : "Please select all required items",
      );
      return;
    }

    if (selectedChildrenIds.length === 0) {
      warningAlert(SELECT_AT_LEAST_ONE_CHILD_MESSAGE[language]);
      return;
    }

    if (childProfiles.length === 0) {
      errorAlert(
        language === "ja"
          ? "子供のプロフィールが見つかりません"
          : "No child profiles found",
      );
      return;
    }

    if (!customerId) {
      errorAlert(
        language === "ja" ? "顧客IDが見つかりません" : "Customer ID not found",
      );
      return;
    }

    setIsBooking(true);

    try {
      const conflictsResult = await checkChildConflicts(
        selectedDateTime,
        selectedChildrenIds,
      );

      if ("message" in conflictsResult) {
        errorAlert(conflictsResult.message[language]);
        return;
      }

      if (conflictsResult.conflictingChildren.length > 0) {
        const conflictingChildren =
          conflictsResult.conflictingChildren.join(", ");

        const confirmed = await confirmAlert(
          `${CONFIRM_BOOKING_WITH_CONFLICT_MESSAGE[language]}\n${conflictingChildren}`,
        );

        if (!confirmed) {
          return;
        }
      }

      const doubleBookingResult = await checkDoubleBooking(
        customerId,
        selectedDateTime,
      );

      if ("message" in doubleBookingResult) {
        errorAlert(doubleBookingResult.message[language]);
        return;
      }

      if (doubleBookingResult.isDoubleBooked) {
        const confirmed = await confirmAlert(
          DOUBLE_BOOKING_CONFIRMATION_MESSAGE[language],
        );

        if (!confirmed) {
          return;
        }
      }

      const result = await rebookClassWithValidation({
        customerId,
        classId,
        dateTime: selectedDateTime,
        instructorId: selectedInstructor.id,
        childrenIds: selectedChildrenIds,
        userSessionType: adminId ? "admin" : "customer",
        language,
      });

      if (result.error) {
        errorAlert(
          result.error === "unauthorized"
            ? LOGIN_REQUIRED_MESSAGE[language]
            : result.error,
        );
        return;
      }

      toast.success(
        language === "ja"
          ? "予約が完了しました"
          : "Booking completed successfully.",
      );
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Booking failed:", error);
      errorAlert(language === "ja" ? "予約に失敗しました" : "Booking failed");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className={styles.progressiveFlow}>
      <div className={styles.modalHeader}>
        <h2>
          {language === "ja"
            ? isFreeTrial
              ? `${classCode || classId} の予約`
              : `${classCode || classId} の予約変更`
            : isFreeTrial
              ? `Book ${classCode || `Class ${classId}`}`
              : `Rebook ${classCode || `Class ${classId}`}`}
        </h2>
      </div>
      <div className={styles.sectionsContainer}>
        {/* Step 1: Mode Selection */}
        <div className={`${styles.section} ${styles[stepStatus.mode]}`}>
          <div className={styles.sectionHeader}>
            <h3>
              {language === "ja" ? "予約方法を選択" : "Select Booking Method"}
            </h3>
            {stepStatus.mode === "completed" && selectedMode && (
              <>
                <span className={styles.selectedValue}>
                  {language === "ja"
                    ? selectedMode === "instructor"
                      ? "講師から選択"
                      : "日時から選択"
                    : selectedMode === "instructor"
                      ? "Select by Instructor"
                      : "Select by Date & Time"}
                </span>
                <button
                  onClick={handleChangeMode}
                  className={styles.changeButton}
                >
                  {language === "ja" ? "変更" : "Change"}
                </button>
              </>
            )}
          </div>
          {stepStatus.mode === "current" && (
            <div className={styles.sectionContent}>
              <ModeSelection
                onModeSelect={handleModeSelect}
                language={language}
              />
            </div>
          )}
        </div>

        {/* Step 2: Instructor Selection (for instructor-first mode) */}
        {selectedMode === "instructor" && (
          <div className={`${styles.section} ${styles[stepStatus.instructor]}`}>
            <div className={styles.sectionHeader}>
              <h3>{language === "ja" ? "講師を選択" : "Select Instructor"}</h3>
              {stepStatus.instructor === "completed" && selectedInstructor && (
                <>
                  <span className={styles.selectedValue}>
                    {selectedInstructor.nickname}
                  </span>
                  <button
                    onClick={handleChangeInstructor}
                    className={styles.changeButton}
                  >
                    {language === "ja" ? "変更" : "Change"}
                  </button>
                </>
              )}
            </div>
            {stepStatus.instructor === "current" && (
              <div className={styles.sectionContent}>
                <InstructorSelection
                  onInstructorSelect={handleInstructorSelect}
                  plan={plan}
                  language={language}
                  customerId={customerId}
                  adminId={adminId}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date/Time Selection (for datetime-first mode) */}
        {selectedMode === "datetime" && (
          <div className={`${styles.section} ${styles[stepStatus.datetime]}`}>
            <div className={styles.sectionHeader}>
              <h3>{language === "ja" ? "日付を選択" : "Select Date"}</h3>
              {stepStatus.datetime === "completed" && selectedDateTime && (
                <>
                  <span className={styles.selectedValue}>
                    {new Date(selectedDateTime).toLocaleString(
                      language === "ja" ? "ja-JP" : "en-US",
                    )}
                  </span>
                  <button
                    onClick={handleChangeDateTime}
                    className={styles.changeButton}
                  >
                    {language === "ja" ? "変更" : "Change"}
                  </button>
                </>
              )}
            </div>
            {stepStatus.datetime === "current" && (
              <div className={styles.sectionContent}>
                <DateTimeSelection
                  onSlotSelect={handleSlotSelect}
                  language={language}
                  selectedInstructor={null}
                  englishBackground={
                    plan?.englishBackground || EnglishBackground.NonNative
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date/Time Selection (for instructor-first mode) */}
        {selectedMode === "instructor" && selectedInstructor && (
          <div className={`${styles.section} ${styles[stepStatus.datetime]}`}>
            <div className={styles.sectionHeader}>
              <h3>{language === "ja" ? "日付を選択" : "Select Date"}</h3>
              {stepStatus.datetime === "completed" && selectedDateTime && (
                <>
                  <span className={styles.selectedValue}>
                    {new Date(selectedDateTime).toLocaleString(
                      language === "ja" ? "ja-JP" : "en-US",
                    )}
                  </span>
                  <button
                    onClick={handleChangeDateTime}
                    className={styles.changeButton}
                  >
                    {language === "ja" ? "変更" : "Change"}
                  </button>
                </>
              )}
            </div>
            {stepStatus.datetime === "current" && (
              <div className={styles.sectionContent}>
                <DateTimeSelection
                  onSlotSelect={handleSlotSelect}
                  language={language}
                  selectedInstructor={selectedInstructor}
                  englishBackground={
                    plan?.englishBackground || EnglishBackground.NonNative
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Instructor Selection (for datetime-first mode) */}
        {selectedMode === "datetime" && selectedDateTime && (
          <div className={`${styles.section} ${styles[stepStatus.instructor]}`}>
            <div className={styles.sectionHeader}>
              <h3>{language === "ja" ? "講師を選択" : "Select Instructor"}</h3>
              {stepStatus.instructor === "completed" && selectedInstructor && (
                <>
                  <span className={styles.selectedValue}>
                    {selectedInstructor.nickname}
                  </span>
                  <button
                    onClick={handleChangeInstructor}
                    className={styles.changeButton}
                  >
                    {language === "ja" ? "変更" : "Change"}
                  </button>
                </>
              )}
            </div>
            {stepStatus.instructor === "current" && (
              <div className={styles.sectionContent}>
                <InstructorSelection
                  onInstructorSelect={handleInstructorSelectFromDateTime}
                  language={language}
                  availableInstructors={availableInstructors}
                  customerId={customerId}
                  adminId={adminId}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4: Confirmation */}
        {stepStatus.confirmation === "current" &&
          selectedInstructor &&
          selectedDateTime && (
            <div
              className={`${styles.section} ${styles[stepStatus.confirmation]}`}
            >
              <div className={styles.sectionHeader}>
                <h3>
                  {language === "ja" ? "予約確認" : "Booking Confirmation"}
                </h3>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.confirmationDetails}>
                  <p>
                    <strong>
                      {language === "ja" ? "講師:" : "Instructor:"}
                    </strong>{" "}
                    {selectedInstructor.nickname}
                  </p>
                  <p>
                    <strong>
                      {language === "ja" ? "日時:" : "Date & Time:"}
                    </strong>{" "}
                    {new Date(selectedDateTime).toLocaleString(
                      language === "ja" ? "ja-JP" : "en-US",
                      {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      },
                    )}
                  </p>
                </div>

                <div className={styles.childrenSelection}>
                  <div className={styles.childrenTitle}>
                    <UsersIcon className={styles.childrenIcon} />
                    <p>
                      {language === "ja"
                        ? "参加されるお子さま"
                        : "Attending children"}
                    </p>
                  </div>
                  <div className={styles.childrenCheckboxes}>
                    {childProfiles.map((child) => (
                      <ChildCheckbox
                        key={child.id}
                        child={child}
                        checked={selectedChildrenIds.some(
                          (id) => id === child.id,
                        )}
                        onChange={handleChildChange}
                      />
                    ))}
                  </div>
                </div>

                <div className={styles.confirmationActions}>
                  <button onClick={onClose} className={styles.cancelButton}>
                    {language === "ja" ? "キャンセル" : "Cancel"}
                  </button>
                  <button
                    className={styles.confirmButton}
                    disabled={selectedChildrenIds.length === 0 || isBooking}
                    onClick={handleConfirmBooking}
                  >
                    {isBooking
                      ? language === "ja"
                        ? "予約中..."
                        : "Booking..."
                      : language === "ja"
                        ? "予約確定"
                        : "Confirm Booking"}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
