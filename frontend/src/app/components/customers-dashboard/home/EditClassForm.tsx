import { UserCircleIcon, CalendarIcon } from "@heroicons/react/24/outline";
import styles from "./AddClassForm.module.scss";
import { useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/app/helper/dateUtils";
import { editClass } from "@/app/helper/classesApi";
import { useRouter } from "next/navigation";
import { useSelect } from "@/app/hooks/useSelect";

function EditClassForm({
  customerId,
  instructors,
  children,
  editedClass,
}: {
  customerId: string;
  instructors: Instructor[];
  children: Child[];
  editedClass: ClassType;
}) {
  const [selectedInstructorId, setSelectedInstructorId] = useState<
    number | null
  >(editedClass.instructor.id);

  const [selectedDateTime, setSelectedDateTime, onSelectedDateTimeChange] =
    useSelect(editedClass.dateTime);

  const [selectedChildrenIds, setSelectedChildrenIds] = useState<Set<number>>(
    new Set(editedClass.classAttendance.children.map((child) => child.id)),
  );
  const router = useRouter();

  const selectedInstructorAvailabilities =
    instructors.find((instructor) => instructor.id === selectedInstructorId)
      ?.availabilities || [];

  const handleInstructorChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedInstructorId = parseInt(event.target.value, 10);
    setSelectedInstructorId(selectedInstructorId);

    setSelectedDateTime("");
  };

  const handleChildChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    changedChildId: number,
  ) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      selectedChildrenIds.add(changedChildId);
    } else {
      selectedChildrenIds.delete(changedChildId);
    }
    setSelectedChildrenIds(new Set(selectedChildrenIds));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedInstructorId || !selectedDateTime) return;

    if (selectedChildrenIds.size === 0) {
      alert("Please choose at least one attending child.");
      return;
    }

    const selectedChildrenIdsArray = Array.from(selectedChildrenIds);

    try {
      await editClass({
        classId: editedClass.id,
        dateTime: selectedDateTime,
        instructorId: selectedInstructorId,
        childrenIds: selectedChildrenIdsArray,
      });

      router.push(`/customers/${customerId}/dashboard/home`);
    } catch (error) {
      console.error("Failed to edit class:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formContainer}>
        {/* Instructor Name */}
        <div className={styles.field}>
          <label className={styles.label}>
            Choose instructor
            <div className={styles.inputWrapper}>
              <select
                className={styles.select}
                value={selectedInstructorId || ""}
                onChange={handleInstructorChange}
                aria-required="true"
                required
              >
                <option value="" disabled>
                  Select an instructor
                </option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
              <UserCircleIcon className={styles.icon} />
            </div>
          </label>
        </div>

        {/* class date and time */}
        <div className={styles.field}>
          <label className={styles.label}>
            Choose date & time
            <div className={styles.inputWrapper}>
              <select
                className={styles.select}
                value={selectedDateTime}
                onChange={onSelectedDateTimeChange}
                aria-required="true"
                required
              >
                <option value="" disabled>
                  Select a class date and time
                </option>
                {selectedInstructorAvailabilities.map((availability, index) => (
                  <option key={index} value={availability.dateTime}>
                    {formatDateTime(
                      new Date(availability.dateTime),
                      "Asia/Tokyo",
                    )}
                  </option>
                ))}
              </select>
              <CalendarIcon className={styles.icon} />
            </div>
          </label>
        </div>

        {/* Attending Children */}
        <div className={styles.field}>
          <div className={styles.label}>Choose attending children</div>
          <div className={styles.inputWrapper}>
            {children.map((child) => (
              <div key={child.id} className={styles.field}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedChildrenIds.has(child.id)}
                    onChange={(event) => handleChildChange(event, child.id)}
                  />
                  {child.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Link
          href={`/customers/${customerId}/dashboard/home`}
          className={styles.cancelButton}
        >
          Cancel
        </Link>
        <button type="submit" className={styles.submitButton}>
          Edit Class
        </button>
      </div>
    </form>
  );
}

export default EditClassForm;
