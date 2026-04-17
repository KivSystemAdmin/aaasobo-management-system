"use client";

import Modal from "@/components/elements/modal/Modal";
import type { ScheduleUpdateImpactSummary } from "@shared/schemas/instructors";
import styles from "./ScheduleImpactDialog.module.scss";

interface ScheduleImpactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  impactSummary: ScheduleUpdateImpactSummary | null;
}

export default function ScheduleImpactDialog({
  isOpen,
  onClose,
  impactSummary,
}: ScheduleImpactDialogProps) {
  if (!impactSummary) {
    return null;
  }

  const { canceledClassCount, terminatedRecurringClassCount } = impactSummary;

  return (
    <Modal isOpen={isOpen} onClose={onClose} overlayClosable={true}>
      <div className={styles.content}>
        <h3 className={styles.title}>Schedule Update Impact</h3>
        <p className={styles.description}>
          This schedule update affected existing bookings.
        </p>
        <ul className={styles.impactList}>
          {terminatedRecurringClassCount > 0 && (
            <li>
              {terminatedRecurringClassCount} regular{" "}
              {terminatedRecurringClassCount === 1 ? "class was" : "classes were"}{" "}
              terminated.
            </li>
          )}
          {canceledClassCount > 0 && (
            <li>
              {canceledClassCount} booked{" "}
              {canceledClassCount === 1 ? "class was" : "classes were"}{" "}
              canceled by the instructor.
            </li>
          )}
        </ul>
        <p className={styles.note}>
          Canceled classes remain available for the existing rebooking flow.
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}
