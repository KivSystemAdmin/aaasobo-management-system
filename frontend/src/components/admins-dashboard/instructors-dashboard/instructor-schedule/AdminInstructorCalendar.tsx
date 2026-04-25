"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  EventClickArg,
  EventContentArg,
  EventSourceFuncArg,
} from "@fullcalendar/core";
import Calendar from "@/components/features/calendar/Calendar";
import Modal from "@/components/elements/modal/Modal";
import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import {
  getInstructorAbsences,
  getInstructorAvailableSlots,
  getInstructorCalendarSlots,
} from "@/lib/api/instructorsApi";
import {
  batchUpdateInstructorAbsences,
  type AbsenceChange,
} from "@/app/actions/instructorAbsence";
import { errorAlert } from "@/lib/utils/alertUtils";
import { formatYearDateTime } from "@/lib/utils/dateUtils";
import type {
  AbsenceCanceledClassSummary,
  InstructorAbsence,
  InstructorCalendarSlot,
  InstructorCalendarSlotType,
} from "@shared/schemas/instructors";
import { toast } from "react-toastify";
import styles from "./AdminInstructorCalendar.module.scss";

type MainCalendarEvent = {
  id: string;
  start: string;
  end: string;
  title: string;
  color: string;
  textColor: string;
  extendedProps: {
    slotType: InstructorCalendarSlotType;
    classId?: number;
  };
};

type EditCalendarEvent = {
  id: string;
  start: string;
  end: string;
  title: string;
  color: string;
  textColor: string;
  extendedProps: {
    type: "available" | "absence";
    hasPendingChange: boolean;
    changeType: "toRemove";
  };
};

const SLOT_LABELS: Record<InstructorCalendarSlotType, string> = {
  open: "Open",
  booked: "Booked",
  rebooked: "Booked",
  completed: "Done",
  absence: "Absent",
  canceledByInstructor: "Canceled",
};

const SLOT_SYMBOLS: Record<InstructorCalendarSlotType, string> = {
  open: "○",
  booked: "●",
  rebooked: "●",
  completed: "✓",
  absence: "−",
  canceledByInstructor: "×",
};

export default function AdminInstructorCalendar({
  instructorId,
}: {
  instructorId: number;
}) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalRefreshKey, setModalRefreshKey] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, AbsenceChange>
  >(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canceledClasses, setCanceledClasses] = useState<
    AbsenceCanceledClassSummary[]
  >([]);

  const formatJSTDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const refreshCalendars = () => {
    setRefreshKey((prev) => prev + 1);
    setModalRefreshKey((prev) => prev + 1);
  };

  const buildMainEvent = (slot: InstructorCalendarSlot): MainCalendarEvent => ({
    id: `${slot.slotType}-${slot.classId ?? slot.start}`,
    start: slot.start,
    end: slot.end,
    title: slot.title,
    color: "#FFFFFF",
    textColor: "#111827",
    extendedProps: {
      slotType: slot.slotType,
      classId: slot.classId,
    },
  });

  const fetchCalendarEvents = useCallback(
    async (info: EventSourceFuncArg) => {
      const startStr = formatJSTDate(info.start);
      const endDate = new Date(info.end);
      endDate.setDate(endDate.getDate() + 1);
      const endStr = formatJSTDate(endDate);

      try {
        const response = await getInstructorCalendarSlots(
          instructorId,
          startStr,
          endStr,
        );
        return response.data.map(buildMainEvent);
      } catch (error) {
        console.error("Failed to fetch instructor calendar slots:", error);
        return [];
      }
    },
    [instructorId],
  );

  const fetchEditCalendarEvents = useCallback(
    async (info: EventSourceFuncArg) => {
      const startStr = formatJSTDate(info.start);
      const endDate = new Date(info.end);
      endDate.setDate(endDate.getDate() + 1);
      const endStr = formatJSTDate(endDate);

      try {
        const [slotsResponse, absencesResponse] = await Promise.all([
          getInstructorAvailableSlots(instructorId, startStr, endStr, false),
          getInstructorAbsences(instructorId),
        ]);

        const events: EditCalendarEvent[] = [];

        if ("data" in slotsResponse) {
          events.push(
            ...slotsResponse.data.map((slot) => {
              const pendingChange = pendingChanges.get(slot.dateTime);

              return {
                id: `available-${slot.dateTime}`,
                start: slot.dateTime,
                end: new Date(
                  new Date(slot.dateTime).getTime() + 25 * 60000,
                ).toISOString(),
                title: "Available",
                color: "#A2B098",
                textColor: "#FFF",
                extendedProps: {
                  type: "available" as const,
                  hasPendingChange: pendingChange?.action === "add",
                  changeType: "toRemove" as const,
                },
              };
            }),
          );
        }

        if ("absences" in absencesResponse) {
          events.push(
            ...absencesResponse.absences
              .filter((absence: InstructorAbsence) => {
                const absenceDate = new Date(absence.absentAt);
                return absenceDate >= info.start && absenceDate < info.end;
              })
              .map((absence: InstructorAbsence) => {
                const pendingChange = pendingChanges.get(absence.absentAt);

                return {
                  id: `absence-${absence.absentAt}`,
                  start: absence.absentAt,
                  end: new Date(
                    new Date(absence.absentAt).getTime() + 25 * 60000,
                  ).toISOString(),
                  title: "Absent",
                  color: "#DC2626",
                  textColor: "#FFF",
                  extendedProps: {
                    type: "absence" as const,
                    hasPendingChange: pendingChange?.action === "remove",
                    changeType: "toRemove" as const,
                  },
                };
              }),
          );
        }

        return events;
      } catch (error) {
        console.error("Failed to fetch absence editor data:", error);
        return [];
      }
    },
    [instructorId, pendingChanges],
  );

  const handleMainEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const { slotType, classId } = clickInfo.event.extendedProps as {
        slotType: InstructorCalendarSlotType;
        classId?: number;
      };

      if (
        ["booked", "rebooked", "completed", "canceledByInstructor"].includes(
          slotType,
        ) &&
        classId
      ) {
        router.push(
          `/admins/instructor-list/${instructorId}/class-schedule/${classId}`,
        );
      }
    },
    [instructorId, router],
  );

  const handleSlotToggle = useCallback((clickInfo: EventClickArg) => {
    const eventType = clickInfo.event.extendedProps.type;
    const dateTime = clickInfo.event.start!.toISOString();

    setPendingChanges((prev) => {
      const newChanges = new Map(prev);

      if (newChanges.has(dateTime)) {
        newChanges.delete(dateTime);
      } else if (eventType === "absence") {
        newChanges.set(dateTime, {
          dateTime,
          action: "remove",
          originalType: "absence",
        });
      } else if (eventType === "available") {
        newChanges.set(dateTime, {
          dateTime,
          action: "add",
          originalType: "available",
        });
      }

      return newChanges;
    });
  }, []);

  const handleBatchSubmit = async () => {
    if (pendingChanges.size === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const changes = Array.from(pendingChanges.values());
      const result = await batchUpdateInstructorAbsences(instructorId, changes);

      if (result.success) {
        setPendingChanges(new Map());
        setCanceledClasses(result.canceledClasses);
        refreshCalendars();
        setIsEditModalOpen(false);
        if (result.message) {
          toast.success(result.message);
        }
      } else if (
        result.successCount.add > 0 ||
        result.successCount.remove > 0
      ) {
        setPendingChanges(new Map());
        setCanceledClasses(result.canceledClasses);
        refreshCalendars();
        setIsEditModalOpen(false);

        await errorAlert(
          `${result.message}\n\nErrors:\n${result.errors.join("\n")}`,
        );
      } else if (result.errors.length > 0) {
        await errorAlert(
          `${result.message}\n\nErrors:\n${result.errors.join("\n")}`,
        );
      } else {
        toast.info(result.message || "No changes were made.");
      }
    } catch (error) {
      console.error("Batch submission failed:", error);
      errorAlert(
        `Failed to submit changes: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMainEventContent = useCallback((eventInfo: EventContentArg) => {
    const slotType = eventInfo.event.extendedProps
      .slotType as InstructorCalendarSlotType;
    const isClickable = slotType !== "open" && slotType !== "absence";
    const titleText =
      eventInfo.event.title &&
      !["open", "absence"].includes(slotType) &&
      eventInfo.event.title !== SLOT_LABELS[slotType] &&
      eventInfo.event.title !== "Class"
        ? eventInfo.event.title
        : "";
    const compactLabel = titleText
      ? `${SLOT_LABELS[slotType]} - ${titleText}`
      : SLOT_LABELS[slotType];

    return (
      <div
        className={`${styles.eventBlock} ${isClickable ? styles.clickable : ""}`}
      >
        <div className={styles.eventHeader}>
          <span className={styles.statusBadge}>
            <span className={styles.statusSymbol}>
              {SLOT_SYMBOLS[slotType]}
            </span>
            {compactLabel}
          </span>
        </div>
      </div>
    );
  }, []);

  return (
    <div className={styles.container}>
      <Calendar
        key={refreshKey}
        height="auto"
        contentHeight="auto"
        events={fetchCalendarEvents}
        eventClick={handleMainEventClick}
        eventContent={renderMainEventContent}
        eventClassNames={(arg) => {
          const slotType = arg.event.extendedProps
            .slotType as InstructorCalendarSlotType;

          const classMap: Record<InstructorCalendarSlotType, string> = {
            open: styles.slotOpen,
            booked: styles.slotBooked,
            rebooked: styles.slotBooked,
            completed: styles.slotCompleted,
            canceledByInstructor: styles.slotOpen,
            absence: styles.slotAbsent,
          };

          return [styles.calendarEvent, classMap[slotType]];
        }}
        selectable={false}
        headerRight={
          <ActionButton
            btnText="Edit Absences"
            onClick={() => setIsEditModalOpen(true)}
            className="editBtn"
          />
        }
      />

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        overlayClosable={true}
        maxHeight="90vh"
        padding="40px"
      >
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h2>Edit Instructor Absences</h2>
            <p>
              Click available slots to mark as absent, or click absence slots to
              remove them.
            </p>
          </div>

          <div className={styles.editLegend}>
            <div className={styles.editLegendItem}>
              <div className={`${styles.editLegendBox} ${styles.available}`} />
              <span>Available</span>
            </div>
            <div className={styles.editLegendItem}>
              <div className={`${styles.editLegendBox} ${styles.absence}`} />
              <span>Absence</span>
            </div>
            <div className={styles.editLegendItem}>
              <div
                className={`${styles.editLegendBox} ${styles.available} ${styles.withBadge} ${styles.willBeAbsent}`}
              />
              <span>Will be Absent</span>
            </div>
            <div className={styles.editLegendItem}>
              <div
                className={`${styles.editLegendBox} ${styles.absence} ${styles.withBadge} ${styles.willBeAvailable}`}
              />
              <span>Will be Available</span>
            </div>
          </div>

          <div className={styles.calendarContainer}>
            <Calendar
              key={modalRefreshKey}
              height="100%"
              contentHeight="auto"
              events={fetchEditCalendarEvents}
              eventClick={handleSlotToggle}
              selectable={false}
              eventDidMount={(info) => {
                const { hasPendingChange, changeType, type } =
                  info.event.extendedProps;
                if (hasPendingChange && changeType === "toRemove") {
                  const element = info.el;
                  element.style.position = "relative";

                  const badge = document.createElement("div");
                  badge.className = styles.eventBadge;

                  if (type === "available") {
                    badge.classList.add(styles.willBeAbsent);
                    badge.title = "Will be marked absent";
                  } else if (type === "absence") {
                    badge.classList.add(styles.willBeAvailable);
                    badge.title = "Will be removed";
                  }

                  element.appendChild(badge);
                }
              }}
            />
          </div>

          <div className={styles.modalActions}>
            <ActionButton
              type="button"
              onClick={() => {
                setPendingChanges(new Map());
                setIsEditModalOpen(false);
              }}
              disabled={isSubmitting}
              className="cancelBtn"
              btnText="Cancel"
            />
            <ActionButton
              type="button"
              onClick={handleBatchSubmit}
              disabled={pendingChanges.size === 0 || isSubmitting}
              className="submitBtn"
              btnText={
                isSubmitting
                  ? "Submitting..."
                  : `Submit (${pendingChanges.size})`
              }
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={canceledClasses.length > 0}
        onClose={() => setCanceledClasses([])}
        overlayClosable={true}
        maxHeight="90vh"
        padding="40px"
      >
        <div className={styles.summaryModal}>
          <div className={styles.summaryHeader}>
            <h2>Classes Canceled</h2>
            <p>
              {canceledClasses.length} classes were canceled for the registered
              absence and are now rebookable.
            </p>
          </div>

          <div className={styles.summaryTableWrapper}>
            <table className={styles.summaryTable}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Class Time</th>
                  <th>Class Code</th>
                  <th>Rebookable Until</th>
                </tr>
              </thead>
              <tbody>
                {canceledClasses.map((classItem) => (
                  <tr key={classItem.id}>
                    <td>{classItem.customer.name}</td>
                    <td>{formatYearDateTime(new Date(classItem.dateTime))}</td>
                    <td>{classItem.classCode}</td>
                    <td>
                      {formatYearDateTime(new Date(classItem.rebookableUntil))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.summaryActions}>
            <ActionButton
              type="button"
              onClick={() => setCanceledClasses([])}
              className="submitBtn"
              btnText="Close"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
