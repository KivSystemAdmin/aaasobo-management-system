"use client";

import React, { useState, useEffect } from "react";
import Modal from "../../elements/modal/Modal";
import { editRecurringClass } from "@/lib/api/recurringClassesApi";
import InstructorSelection from "../classes/classActions/bookingActions/InstructorSelection";
import InstructorSchedule from "./InstructorSchedule";
import { EnglishBackground } from "@/types";
import {
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/solid";
import styles from "./EditRegularClassModal.module.scss";

interface EditRegularClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringClass: RecurringClass;
  customerId: number;
  allChildren: Child[];
  userSessionType?: UserType;
  adminId?: number;
  onSuccess?: () => void;
  plan?: Plan;
}

export default function EditRegularClassModal({
  isOpen,
  onClose,
  recurringClass,
  customerId,
  allChildren,
  userSessionType,
  adminId,
  onSuccess,
  plan,
}: EditRegularClassModalProps) {
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
    if (recurringClass.instructor?.id) {
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
    if (recurringClass.recurringClassAttendance) {
      const currentChildrenIds = recurringClass.recurringClassAttendance.map(
        (att) => att.children.id,
      );
      setSelectedChildrenIds(currentChildrenIds);
    }

    // Set current schedule slot as default
    const scheduleDate = recurringClass.dateTime || recurringClass.startAt;
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
      setError("Please select a start date");
      return;
    }

    const finalInstructor = selectedInstructor || {
      id: recurringClass.instructor!.id,
      nickname: recurringClass.instructor!.nickname || "Unknown",
      name: recurringClass.instructor!.nickname || "Unknown",
      icon: (recurringClass.instructor!.icon as any)?.url || "",
      introduction: "",
      classURL: recurringClass.instructor!.classURL || "",
      meetingId: recurringClass.instructor!.meetingId || "",
      passcode: recurringClass.instructor!.passcode || "",
      englishBackground:
        recurringClass.instructor!.englishBackground ||
        EnglishBackground.NonNative,
    };

    let finalWeekday = selectedWeekday;
    let finalStartTime = selectedStartTime;

    if (finalWeekday === null || !finalStartTime) {
      const scheduleDate = recurringClass.dateTime || recurringClass.startAt;
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
      setError("Unable to determine schedule. Please select a time slot.");
      return;
    }

    const finalChildrenIds =
      selectedChildrenIds.length > 0
        ? selectedChildrenIds
        : recurringClass.recurringClassAttendance.map((att) => att.children.id);

    if (finalChildrenIds.length === 0) {
      setError("At least one child must be selected for the class");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updateData = {
        instructorId: finalInstructor.id,
        customerId: customerId,
        childrenIds: finalChildrenIds,
        weekday: finalWeekday,
        startTime: finalStartTime,
        startDate: startDate,
        timezone: "Asia/Tokyo",
      };

      await editRecurringClass(recurringClass.id, updateData);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Failed to update regular class:", error);
      setError(error.message || "Failed to update regular class");
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
          <h2>Edit Regular Class Schedule</h2>
        </div>

        <div className={styles.sectionsContainer}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Start Date Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <CalendarIcon className={styles.sectionIcon} />
              <h3>Start New Schedule On</h3>
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
              <h3>Instructor & Schedule</h3>
              {selectedInstructor &&
                selectedWeekday !== null &&
                selectedStartTime && (
                  <>
                    <span className={styles.selectedValue}>
                      {selectedInstructor.nickname} -{" "}
                      {
                        [
                          "Sunday",
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                        ][selectedWeekday]
                      }{" "}
                      {selectedStartTime}
                    </span>
                    <button
                      onClick={handleEditInstructor}
                      className={styles.changeButton}
                    >
                      Change
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
                    language="en"
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
                    />
                  )}
              </div>
            )}
          </div>

          {/* Children Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <UserGroupIcon className={styles.sectionIcon} />
              <h3>Children</h3>
              <span className={styles.selectedValue}>
                {selectedChildrenIds.length > 0
                  ? `${allChildren
                      .filter((child) => selectedChildrenIds.includes(child.id))
                      .map((child) => child.name)
                      .join(
                        ", ",
                      )} (${selectedChildrenIds.length} child${selectedChildrenIds.length !== 1 ? "ren" : ""})`
                  : `${recurringClass.recurringClassAttendance
                      .map((att) => att.children.name)
                      .join(
                        ", ",
                      )} (${recurringClass.recurringClassAttendance.length} child${recurringClass.recurringClassAttendance.length !== 1 ? "ren" : ""})`}
              </span>
              <button
                onClick={() => setEditingChildren(!editingChildren)}
                className={styles.changeButton}
              >
                Change
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
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmChildrenSelection}
                    className={styles.confirmButton}
                    disabled={selectedChildrenIds.length === 0}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={styles.confirmationActions}>
            <button onClick={resetAndClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={styles.confirmButton}
              disabled={loading || selectedChildrenIds.length === 0}
            >
              {loading ? "Applying..." : "Apply Changes"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
