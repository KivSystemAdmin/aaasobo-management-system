import { UserCircleIcon, CalendarIcon } from "@heroicons/react/24/outline";
import styles from "./BookClassForm.module.scss";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/app/helper/dateUtils";
import {
  bookClass,
  checkChildrenAvailability,
  checkDoubleBooking,
} from "@/app/helper/classesApi";
import { useRouter } from "next/navigation";
import { fetchInstructorAvailabilitiesForTomorrowAndAfter } from "@/app/helper/instructorsApi";
import RedirectButton from "../../RedirectButton";
import ActionButton from "../../ActionButton";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function BookClassForm({
  customerId,
  instructors,
  children,
  classToRebook,
  isAdminAuthenticated,
}: {
  customerId: string;
  instructors: Instructor[];
  children: Child[];
  classToRebook: ClassType | undefined;
  isAdminAuthenticated?: boolean;
}) {
  const [selectedInstructorId, setSelectedInstructorId] = useState<
    number | null
  >(null);
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<Set<number>>(
    new Set(),
  );
  const [instructorAvailabilities, setInstructorAvailabilities] = useState<
    string[]
  >([]);

  const router = useRouter();

  useEffect(() => {
    const fetchInstructorAvailabilities = async () => {
      if (selectedInstructorId === null) return;
      const fetchedInstructorAvailabilities =
        await fetchInstructorAvailabilitiesForTomorrowAndAfter(
          selectedInstructorId,
        );

      setInstructorAvailabilities(fetchedInstructorAvailabilities);
    };
    fetchInstructorAvailabilities();
  }, [selectedInstructorId]);

  const handleInstructorChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedInstructorId = parseInt(event.target.value, 10);
    setSelectedInstructorId(selectedInstructorId);
    setSelectedDateTime("");
  };

  const handleDateTimeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSelectedDateTime(event.target.value);
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

    if (!selectedInstructorId || !selectedDateTime || !classToRebook) return;

    if (selectedChildrenIds.size === 0) {
      alert("Please choose at least one attending child.");
      return;
    }

    const selectedChildrenIdsArray = Array.from(selectedChildrenIds);

    try {
      // Check if the selected children have another class with another instructor
      const selectedChildrenAvailability = await checkChildrenAvailability(
        selectedDateTime,
        selectedChildrenIdsArray,
      );

      if (selectedChildrenAvailability.error) {
        const userConfirmed = window.confirm(
          selectedChildrenAvailability.error +
            " Do you want to proceed with the booking?",
        );
        if (!userConfirmed) {
          return;
        }
      }

      // Check if there is already a booked class for this customer at the same time
      const classDoubleBookingResult = await checkDoubleBooking(
        parseInt(customerId),
        selectedDateTime,
      );

      if (classDoubleBookingResult.error) {
        const userConfirmed = window.confirm(
          classDoubleBookingResult.error +
            " Do you want to proceed with the booking?",
        );
        if (!userConfirmed) {
          return;
        }
      }

      // Proceed with booking the class
      await bookClass({
        classId: classToRebook.id,
        dateTime: selectedDateTime,
        instructorId: selectedInstructorId,
        customerId: parseInt(customerId),
        status: "booked",
        childrenIds: selectedChildrenIdsArray,
        recurringClassId: classToRebook.recurringClassId,
      });

      if (isAdminAuthenticated) {
        router.push(`/admins/customer-list/${customerId}`);
        return;
      }
      toast.success("The class has been successfully booked!");

      router.push(`/customers/${customerId}/classes`);
    } catch (error) {
      if (error instanceof Error) {
        alert(`${error.message}`);
      } else {
        alert("An unexpected error occurred.");
      }
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
                onChange={handleDateTimeChange}
                aria-required="true"
                required
              >
                <option value="" disabled>
                  Select a class date and time
                </option>
                {instructorAvailabilities.map((availability, index) => (
                  <option key={index} value={availability}>
                    {formatDateTime(new Date(availability), "Asia/Tokyo")}
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
                    onChange={(event) => handleChildChange(event, child.id)}
                    className={styles.checkbox}
                  />
                  {child.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        {isAdminAuthenticated ? (
          <RedirectButton
            btnText="Back"
            linkURL={`/admins/customer-list/${customerId}`}
            className="back"
          />
        ) : (
          <RedirectButton
            btnText="Back"
            linkURL={`/customers/${customerId}/classes`}
            className="deleteChild"
          />
        )}
        <ActionButton
          type="submit"
          btnText="Book Class"
          className="editChild"
        />
      </div>
    </form>
  );
}

export default BookClassForm;
