"use client";

import React, { useState, useEffect } from "react";
import Modal from "../../elements/modal/Modal";
import {
  createRecurringClass,
  editRecurringClass,
} from "@/lib/api/recurringClassesApi";
import InstructorSelection from "../classes/classActions/bookingActions/InstructorSelection";
import InstructorSchedule from "./InstructorSchedule";
import { EnglishBackground } from "@/types";
import {
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/solid";
import { EDIT_REGULAR_CLASS_MESSAGES } from "@/lib/messages/customerDashboard";
import styles from "./EditRegularClassModal.module.scss";

interface EditRegularClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringClass?: RecurringClass;
  subscriptionId?: number;
  customerId: number;
  allChildren: Child[];
  userSessionType?: UserType;
  adminId?: number;
  onSuccess?: () => void;
  plan?: Plan;
  language: LanguageType;
}

export default function EditRegularClassModal({
  isOpen,
  onClose,
  recurringClass,
  subscriptionId,
  customerId,
  allChildren,
  userSessionType,
  adminId,
  onSuccess,
  plan,
  language,
}: EditRegularClassModalProps) {
  const messages = EDIT_REGULAR_CLASS_MESSAGES[language];

  // Form state
  const [startDate, setStartDate] = useState("");
  const [minDate, setMinDate] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState<
    number | null
  >(null);
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<number[]>([]);
  const [selectedInstructor, setSelectedInstructor] =
    useState<InstructorRebookingProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Modal step state
  const [editingInstructor, setEditingInstructor] = useState(false);
  const [editingChildren, setEditingChildren] = useState(false);
  const [modalStep, setModalStep] = useState<"instructor" | "schedule">(
    "instructor",
  );

  // Initialize form with current values
  useEffect(() => {
    if (!isOpen) return;

    // Set minimum date to one week from today
    const today = new Date();
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);
    const minDateString = oneWeekFromNow.toISOString().split("T")[0];
    setMinDate(minDateString);
    setStartDate(minDateString);

    // Set current instructor as default
    if (recurringClass?.instructor?.id) {
      setSelectedInstructorId(recurringClass.instructor.id);
      const currentInstructor = {
        id: recurringClass.instructor.id,
        nickname: recurringClass.instructor.nickname || "Unknown",
        name: recurringClass.instructor.nickname || "Unknown",
        icon: (recurringClass.instructor.icon as any)?.url || "",
        introduction: "",
        classURL: recurringClass.instructor.classURL || "",
        meetingId: recurringClass.instructor.meetingId || "",
        passcode: recurringClass.instructor.passcode || "",
        englishBackground:
          recurringClass.instructor.englishBackground ||
          EnglishBackground.NonNative,
      };
      setSelectedInstructor(currentInstructor);
    }

    // Set current children as default
    if (recurringClass?.recurringClassAttendance) {
      const currentChildrenIds = recurringClass.recurringClassAttendance.map(
        (att) => att.children.id,
      );
      setSelectedChildrenIds(currentChildrenIds);
    }

    // Set current schedule slot as default
    const scheduleDate = recurringClass?.dateTime || recurringClass?.startAt;
    if (scheduleDate) {
      const classDate = new Date(scheduleDate);
      const jstWeekday = classDate.getDay();
      const startTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Tokyo",
      }).format(classDate);
      setSelectedWeekday(jstWeekday);
      setSelectedStartTime(startTime);
    }
  }, [isOpen, recurringClass]);

  const handleInstructorSelect = (instructor: InstructorRebookingProfile) => {
    setSelectedInstructor(instructor);
    setSelectedInstructorId(instructor.id);
    setSelectedWeekday(null);
    setSelectedStartTime("");
    setModalStep("schedule");
  };

  const handleScheduleSlotSelect = (weekday: number, startTime: string) => {
    setSelectedWeekday(weekday);
    setSelectedStartTime(startTime);
    setEditingInstructor(false);
  };

  const handleEditInstructor = () => {
    setEditingInstructor(true);
    setModalStep("instructor");
  };

  const handleChildChange = (childId: number) => {
    setSelectedChildrenIds((prev) => {
      if (prev.includes(childId)) {
        return prev.filter((id) => id !== childId);
      } else {
        return [...prev, childId];
      }
    });
  };

  const handleConfirmChildrenSelection = () => {
    setEditingChildren(false);
  };

  const handleSubmit = async () => {
    if (!startDate) {
      setError(messages.selectStartDate);
      return;
    }

    const finalInstructor =
      selectedInstructor ||
      (recurringClass?.instructor
        ? {
            id: recurringClass.instructor.id,
            nickname: recurringClass.instructor.nickname || "Unknown",
            name: recurringClass.instructor.nickname || "Unknown",
            icon: (recurringClass.instructor.icon as any)?.url || "",
            introduction: "",
            classURL: recurringClass.instructor.classURL || "",
            meetingId: recurringClass.instructor.meetingId || "",
            passcode: recurringClass.instructor.passcode || "",
            englishBackground:
              recurringClass.instructor.englishBackground ||
              EnglishBackground.NonNative,
          }
        : null);

    if (!finalInstructor) {
      setError(messages.scheduleRequired);
      return;
    }

    let finalWeekday = selectedWeekday;
    let finalStartTime = selectedStartTime;

    if (finalWeekday === null || !finalStartTime) {
      const scheduleDate = recurringClass?.dateTime || recurringClass?.startAt;
      if (scheduleDate) {
        const classDate = new Date(scheduleDate);
        finalWeekday = classDate.getDay();
        finalStartTime = new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Tokyo",
        }).format(classDate);
      }
    }

    if (finalWeekday === null || !finalStartTime) {
      setError(messages.scheduleRequired);
      return;
    }

    const finalChildrenIds =
      selectedChildrenIds.length > 0
        ? selectedChildrenIds
        : recurringClass?.recurringClassAttendance.map(
            (att) => att.children.id,
          ) || [];

    if (finalChildrenIds.length === 0) {
      setError(messages.childRequired);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const scheduleData = {
        instructorId: finalInstructor.id,
        customerId: customerId,
        childrenIds: finalChildrenIds,
        weekday: finalWeekday,
        startTime: finalStartTime,
        startDate: startDate,
        timezone: "Asia/Tokyo",
      };

      if (recurringClass) {
        await editRecurringClass(recurringClass.id, scheduleData);
      } else if (subscriptionId) {
        await createRecurringClass({ ...scheduleData, subscriptionId });
      } else {
        throw new Error("Subscription is required");
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Failed to update regular class:", error);
      setError(messages.updateFailed);
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setEditingInstructor(false);
    setEditingChildren(false);
    setModalStep("instructor");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} overlayClosable={true}>
      <div className={styles.progressiveFlow}>
        <div className={styles.modalHeader}>
          <h2>
            {recurringClass
              ? messages.title
              : language === "ja"
                ? "レギュラークラスを追加"
                : "Add Regular Class Schedule"}
          </h2>
        </div>

        <div className={styles.sectionsContainer}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Start Date Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <CalendarIcon className={styles.sectionIcon} />
              <h3>{messages.startNewScheduleOn}</h3>
            </div>
            <div className={styles.sectionContent}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.dateInput}
                min={minDate}
                required
              />
            </div>
          </div>

          {/* Instructor & Schedule Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <AcademicCapIcon className={styles.sectionIcon} />
              <h3>{messages.instructorAndSchedule}</h3>
              {selectedInstructor &&
                selectedWeekday !== null &&
                selectedStartTime && (
                  <>
                    <span className={styles.selectedValue}>
                      {selectedInstructor.nickname} -{" "}
                      {messages.weekdays[selectedWeekday]} {selectedStartTime}
                    </span>
                    <button
                      onClick={handleEditInstructor}
                      className={styles.changeButton}
                    >
                      {messages.change}
                    </button>
                  </>
                )}
            </div>
            {(!selectedInstructor ||
              !selectedStartTime ||
              editingInstructor) && (
              <div className={styles.sectionContent}>
                {modalStep === "instructor" && (
                  <InstructorSelection
                    onInstructorSelect={handleInstructorSelect}
                    plan={plan}
                    language={language}
                    adminId={adminId}
                    customerId={customerId}
                  />
                )}
                {modalStep === "schedule" &&
                  selectedInstructor &&
                  startDate && (
                    <InstructorSchedule
                      instructorId={selectedInstructor.id}
                      effectiveDate={startDate}
                      onSlotSelect={handleScheduleSlotSelect}
                      selectedWeekday={selectedWeekday}
                      selectedStartTime={selectedStartTime}
                      language={language}
                    />
                  )}
              </div>
            )}
          </div>

          {/* Children Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <UserGroupIcon className={styles.sectionIcon} />
              <h3>{messages.children}</h3>
              <span className={styles.selectedValue}>
                {selectedChildrenIds.length > 0
                  ? `${allChildren
                      .filter((child) => selectedChildrenIds.includes(child.id))
                      .map((child) => child.name)
                      .join(", ")} (${
                      language === "ja"
                        ? `${selectedChildrenIds.length}人`
                        : `${selectedChildrenIds.length} child${selectedChildrenIds.length !== 1 ? "ren" : ""}`
                    })`
                  : `${(recurringClass?.recurringClassAttendance || [])
                      .map((att) => att.children.name)
                      .join(", ")} (${
                      language === "ja"
                        ? `${recurringClass?.recurringClassAttendance.length || 0}人`
                        : `${recurringClass?.recurringClassAttendance.length || 0} child${recurringClass?.recurringClassAttendance.length !== 1 ? "ren" : ""}`
                    })`}
              </span>
              <button
                onClick={() => setEditingChildren(!editingChildren)}
                className={styles.changeButton}
              >
                {messages.change}
              </button>
            </div>
            {editingChildren && (
              <div className={styles.sectionContent}>
                <div className={styles.childrenGrid}>
                  {allChildren.map((child) => (
                    <label key={child.id} className={styles.childCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedChildrenIds.includes(child.id)}
                        onChange={() => handleChildChange(child.id)}
                      />
                      <span className={styles.childName}>{child.name}</span>
                    </label>
                  ))}
                </div>
                <div className={styles.childrenActions}>
                  <button
                    onClick={() => setEditingChildren(false)}
                    className={styles.cancelButton}
                  >
                    {messages.cancel}
                  </button>
                  <button
                    onClick={handleConfirmChildrenSelection}
                    className={styles.confirmButton}
                    disabled={selectedChildrenIds.length === 0}
                  >
                    {messages.confirm}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={styles.confirmationActions}>
            <button onClick={resetAndClose} className={styles.cancelButton}>
              {messages.cancel}
            </button>
            <button
              onClick={handleSubmit}
              className={styles.confirmButton}
              disabled={loading || selectedChildrenIds.length === 0}
            >
              {loading ? messages.applying : messages.applyChanges}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
