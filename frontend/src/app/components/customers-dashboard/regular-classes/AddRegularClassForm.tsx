"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInstructors } from "@/app/helper/instructorsApi";
import { ChangeEvent, useEffect, useState } from "react";
import { getChildrenByCustomerId } from "@/app/helper/childrenApi";
import BookingRegularClassCalendar from "./BookingRegularClassCalendar";
import { formatDateTime } from "@/app/helper/dateUtils";
import { addRecurringClass } from "@/app/helper/classesApi";

function AddRegularClassForm({
  customerId,
  subscriptionId,
}: {
  customerId: string;
  subscriptionId: number;
}) {
  const [instructorsData, setInstructorsData] = useState<Instructor[]>();
  const [children, setChildren] = useState<Child[] | undefined>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<
    Instructor | undefined
  >();
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<Set<number>>(
    new Set<number>(),
  );
  const [selectedDateTime, setSelectedInfo] = useState<{
    dateTime: Date;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const data = await getInstructors();
        setInstructorsData(data);
      } catch (error) {
        console.error("Failed to fetch instructors", error);
      }
    };

    const fetchChildrenByCustomerId = async (customerId: string) => {
      try {
        const data = await getChildrenByCustomerId(customerId);
        setChildren(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchInstructors();
    fetchChildrenByCustomerId(customerId);
  }, []);

  // Set the instructor depending on the selected instructor.
  const handleSelectedInstructor = (e: ChangeEvent<HTMLSelectElement>) => {
    if (instructorsData === undefined) {
      return;
    }
    const findInstructor = instructorsData.find(
      (instructor) => instructor.id === Number(e.target.value),
    );
    if (findInstructor === undefined) {
      return;
    }
    setSelectedInstructor(findInstructor);
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

    if (!selectedInstructor || !selectedChildrenIds || !selectedDateTime) {
      return;
    }

    const recurringClassData = {
      instructorId: selectedInstructor.id,
      customerId: parseInt(customerId),
      subscriptionId,
      childrenIds: Array.from(selectedChildrenIds),
      dateTime: selectedDateTime.dateTime.toISOString(),
    };

    try {
      const data = await addRecurringClass(recurringClassData);
      alert(data.message);

      // Redirect the user to regular-classes page
      router.push(`/customers/${customerId}/regular-classes`);
    } catch (error) {
      console.error("Failed to add a new recurring class data:", error);
    }
  };

  if (!instructorsData || !children) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Select the instructor
        <select name="instructors" onChange={handleSelectedInstructor}>
          <option value="">--Please select the instructor--</option>
          {instructorsData &&
            instructorsData.map((instructor: Instructor) => {
              return (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              );
            })}
        </select>
      </label>

      {selectedInstructor && (
        <BookingRegularClassCalendar
          selectedInstructor={selectedInstructor}
          selectable={true}
          select={(info) => {
            setSelectedInfo({ dateTime: info.start });
          }}
        />
      )}

      {selectedDateTime && (
        <p>{formatDateTime(selectedDateTime.dateTime, "Asia/Tokyo")}</p>
      )}

      <div>
        <div>Choose attending children</div>
        <div>
          {children &&
            children.map((child) => (
              <div key={child.id}>
                <label>
                  <input
                    type="checkbox"
                    onChange={(event) => handleChildChange(event, child.id)}
                  />
                  {child.name}
                </label>
              </div>
            ))}
        </div>
      </div>

      <div>
        <Link href={`/customers/${customerId}/regular-classes`}>Cancel</Link>
        <button type="submit">Add Regular Class</button>
      </div>
    </form>
  );
}

export default AddRegularClassForm;
