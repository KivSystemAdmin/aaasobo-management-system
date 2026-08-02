"use client";

import styles from "./InstructorSchedule.module.scss";
import { useState } from "react";
import {
  getInstructorSchedules,
  getInstructorScheduleById,
  createInstructorSchedule,
  InstructorScheduleWithSlots,
  InstructorSlot,
} from "@/lib/api/instructorsApi";
import type {
  InstructorSchedule as Schedule,
  ScheduleUpdateImpactSummary,
} from "@shared/schemas/instructors";
import ScheduleCalendar from "./ScheduleCalendar";
import AddScheduleModal from "./AddScheduleModal";
import ScheduleImpactDialog from "./ScheduleImpactDialog";
import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import { toast } from "react-toastify";
import { errorAlert } from "@/lib/utils/alertUtils";

export default function InstructorSchedule({
  instructorId,
  initialSchedules = [],
  initialSelectedScheduleId = null,
  initialSelectedSchedule = null,
}: {
  instructorId: number;
  initialSchedules?: Schedule[];
  initialSelectedScheduleId?: number | null;
  initialSelectedSchedule?: InstructorScheduleWithSlots | null;
}) {
  // State for versioned schedules
  const inferredScheduleId =
    initialSelectedScheduleId ??
    initialSchedules.find((schedule) => schedule.effectiveTo === null)?.id ??
    null;
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    inferredScheduleId,
  );
  const [selectedSchedule, setSelectedSchedule] =
    useState<InstructorScheduleWithSlots | null>(initialSelectedSchedule);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleImpact, setScheduleImpact] =
    useState<ScheduleUpdateImpactSummary | null>(null);
  const [isImpactDialogOpen, setIsImpactDialogOpen] = useState(false);

  const loadSchedules = async () => {
    try {
      const response = await getInstructorSchedules(instructorId);
      if ("message" in response) {
        errorAlert(response.message as string);
        return;
      }
      setSchedules(response.schedules);
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    }
  };

  // Handle schedule version selection
  const handleScheduleSelection = async (scheduleId: number) => {
    if (!scheduleId) {
      setSelectedScheduleId(null);
      setSelectedSchedule(null);
      return;
    }

    setSelectedScheduleId(scheduleId);

    try {
      const response = await getInstructorScheduleById(
        instructorId,
        scheduleId,
      );
      if ("message" in response) {
        errorAlert(response.message as string);
        return;
      }
      setSelectedSchedule(response.schedule);
    } catch (error) {
      console.error("Failed to fetch schedule details:", error);
    }
  };

  // Handle creating new schedule
  const handleCreateSchedule = async (
    effectiveFrom: string,
    slots: Omit<InstructorSlot, "scheduleId">[],
  ) => {
    try {
      const response = await createInstructorSchedule(
        instructorId,
        effectiveFrom,
        slots,
      );

      if ("message" in response) {
        errorAlert(response.message as string);
        return false;
      }

      // Refresh schedules and select the new one
      await loadSchedules();
      setSelectedScheduleId(response.schedule.id);
      setSelectedSchedule(response.schedule);
      if (
        response.impactSummary.canceledClassCount > 0 ||
        response.impactSummary.terminatedRecurringClassCount > 0
      ) {
        setScheduleImpact(response.impactSummary);
        setIsImpactDialogOpen(true);
      }
      toast.success("Schedule created successfully.");
      return true;
    } catch (error) {
      console.error("Failed to create schedule:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      errorAlert(`Failed to create schedule: ${errorMessage}`);
      return false;
    }
  };

  return (
    <>
      <div className={styles.dateInput}>
        <div className={styles.scheduleHeader}>
          <label className={styles.label}>
            スケジュール期間 (日本時間)
            <select
              className={styles.input}
              value={selectedScheduleId || ""}
              onChange={(e) => handleScheduleSelection(Number(e.target.value))}
            >
              <option value="">スケジュール期間を選択</option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {new Date(schedule.effectiveFrom).toLocaleDateString(
                    "ja-JP",
                    { timeZone: "Asia/Tokyo" },
                  )}{" "}
                  -{" "}
                  {schedule.effectiveTo
                    ? new Date(
                        new Date(schedule.effectiveTo).getTime() -
                          +24 * 60 * 60 * 1000,
                      ).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })
                    : "現在"}
                </option>
              ))}
            </select>
          </label>
          <ActionButton
            type="button"
            onClick={() => setIsModalOpen(true)}
            btnText="新しいスケジュールを作成"
            className="addBtn"
          />
        </div>
      </div>

      {selectedSchedule && <ScheduleCalendar slots={selectedSchedule.slots} />}

      {!selectedSchedule && schedules.length === 0 && (
        <div className={styles.noSchedules}>
          <p>登録済みのスケジュールが見つかりません。</p>
        </div>
      )}

      {isModalOpen && (
        <AddScheduleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateSchedule}
          initialSlots={selectedSchedule?.slots || []}
        />
      )}

      <ScheduleImpactDialog
        isOpen={isImpactDialogOpen}
        onClose={() => setIsImpactDialogOpen(false)}
        impactSummary={scheduleImpact}
      />
    </>
  );
}
