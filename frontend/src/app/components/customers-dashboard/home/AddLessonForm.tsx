import { UserCircleIcon, CalendarIcon } from "@heroicons/react/24/outline";
import styles from "./AddLessonForm.module.scss";
import { useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/app/helper/dateUtils";
import { addLesson } from "@/app/helper/lessonsApi";
import { useRouter } from "next/navigation";

function AddLessonForm({
  instructors,
  customerId,
}: {
  instructors: Instructor[];
  customerId: string;
}) {
  const [selectedInstructorId, setSelectedInstructorId] = useState<
    number | null
  >(null);
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");
  const router = useRouter();

  const selectedInstructorAvailabilities =
    instructors.find((instructor) => instructor.id === selectedInstructorId)
      ?.availabilities || [];

  const handleInstructorChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const instructorId = Number(event.target.value);
    setSelectedInstructorId(instructorId);

    setSelectedDateTime("");
  };

  const handleDateTimeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedDateTime(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedInstructorId === null || selectedDateTime === "") {
      alert("Please select both an instructor and a date/time");
      return;
    }

    try {
      const result = await addLesson({
        dateTime: selectedDateTime,
        instructorId: selectedInstructorId,
        customerId: Number(customerId),
        status: "booked",
      });

      // Redirect to lessons page (dashboard)
      router.push(`/customers/${customerId}/dashboard/home`);
    } catch (error) {
      console.error("Failed to add lesson:", error);
    }
  };

  return (
    // <form action={formAction}>
    <form onSubmit={handleSubmit}>
      <div className={styles.formContainer}>
        {/* Instructor Name */}
        <div className={styles.field}>
          <label htmlFor="instructor" className={styles.label}>
            Choose instructor
          </label>
          <div className={styles.inputWrapper}>
            <select
              id="instructor"
              name="instructorId"
              className={styles.select}
              value={selectedInstructorId || ""}
              onChange={handleInstructorChange}
              aria-required="true"
              aria-label="Choose instructor"
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
        </div>

        {/* Lesson date and time */}
        <div className={styles.field}>
          <label htmlFor="dateTime" className={styles.label}>
            Choose date & time
          </label>
          <div className={styles.inputWrapper}>
            <select
              id="dateTime"
              name="lessonDateTime"
              className={styles.select}
              value={selectedDateTime}
              onChange={handleDateTimeChange}
              aria-required="true"
              aria-label="Choose date and time"
            >
              <option value="" disabled>
                Select a lesson date and time
              </option>
              {selectedInstructorAvailabilities.map((availability, index) => (
                <option key={index} value={availability.dateTime}>
                  {formatDateTime(
                    new Date(availability.dateTime),
                    "Asia/Tokyo"
                  )}
                </option>
              ))}
            </select>
            <CalendarIcon className={styles.icon} />
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
          Add Lesson
        </button>
      </div>
    </form>
  );
}

export default AddLessonForm;
