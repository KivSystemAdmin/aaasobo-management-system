import { useState } from "react";
import Modal from "@/components/elements/modal/Modal";
import EditableScheduleCalendar from "./EditableScheduleCalendar";
import { InstructorSlot } from "@/lib/api/instructorsApi";
import { slotToKey, keyToSlot } from "@/lib/utils/scheduleUtils";
import styles from "./AddScheduleModal.module.scss";

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    effectiveFrom: string,
    slots: Omit<InstructorSlot, "scheduleId">[],
  ) => Promise<boolean>;
  initialSlots?: InstructorSlot[];
}

export default function AddScheduleModal({
  isOpen,
  onClose,
  onSubmit,
  initialSlots = [],
}: AddScheduleModalProps) {
  const slotsToKeys = (slots: InstructorSlot[]): Set<string> => {
    return new Set(
      slots.map((slot) => {
        return slotToKey(slot.weekday, slot.startTime);
      }),
    );
  };

  const keysToSlots = (
    keys: Set<string>,
  ): Omit<InstructorSlot, "scheduleId">[] => {
    return Array.from(keys).map((key) => {
      const { weekday, startTime } = keyToSlot(key);
      return {
        weekday,
        startTime,
      };
    });
  };

  const [effectiveFrom, setEffectiveFrom] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [editedSlots, setEditedSlots] = useState<Set<string>>(() =>
    slotsToKeys(initialSlots),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSlot = (weekday: number, time: string) => {
    const key = slotToKey(weekday, time);
    setEditedSlots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveFrom || isSubmitting) {
      return;
    }

    const slots = keysToSlots(editedSlots);
    setIsSubmitting(true);
    try {
      const succeeded = await onSubmit(effectiveFrom, slots);
      if (succeeded) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxHeight="90vh">
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>新しいスケジュールを追加する</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.dateSection}>
              <label htmlFor="effectiveFrom">
                <strong>開始日:</strong>
                <input
                  id="effectiveFrom"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className={styles.dateInput}
                />
              </label>
            </div>

            <div className={styles.scheduleSection}>
              <p>
                <strong>スケジュール設定:</strong>
              </p>
              <p>時間枠をクリックして予定を追加または削除します。</p>

              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <div
                    className={`${styles.legendDot} ${styles.unchanged}`}
                  ></div>
                  <span>現状</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendDot} ${styles.added}`}></div>
                  <span>追加</span>
                </div>
                <div className={styles.legendItem}>
                  <div
                    className={`${styles.legendDot} ${styles.removed}`}
                  ></div>
                  <span>削除</span>
                </div>
              </div>

              <div className={styles.calendarContainer}>
                <EditableScheduleCalendar
                  initialSlots={initialSlots}
                  editedSlots={editedSlots}
                  onSlotToggle={toggleSlot}
                />
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!effectiveFrom || isSubmitting}
            >
              {isSubmitting ? "作成中..." : "スケジュールを作成"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
