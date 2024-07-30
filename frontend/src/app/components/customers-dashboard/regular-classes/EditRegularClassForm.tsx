"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInstructors } from "@/app/helper/instructorsApi";
import { useEffect, useState } from "react";
import { getChildrenByCustomerId } from "@/app/helper/childrenApi";
import { getRecurringClassesBySubscriptionId } from "@/app/helper/classesApi";
import { useMultipleSelect } from "@/app/hooks/useSelect";

function EditRegularClassForm({
  customerId,
  subscriptionId,
  isAdminAuthenticated,
}: {
  customerId: string;
  subscriptionId: number;
  isAdminAuthenticated?: boolean;
}) {
  const [instructorsData, setInstructorsData] = useState<Instructor[]>([]);
  const [children, setChildren] = useState<Child[] | undefined>([]);
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<Set<number>[]>(
    [],
  );
  const [selectedDays, setSelectedDays, onDayChange] = useMultipleSelect([]);
  const [selectedTimes, setSelectedTimes, onTimeChange] = useMultipleSelect([]);
  const [
    selectedInstructorIds,
    setSelectedInstructorIds,
    onInstructorIdsChange,
  ] = useMultipleSelect([]);
  const [recurringClassesData, setRecurringClassesData] =
    useState<RecurringClasses | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch recurring classes by subscription id
    const fetchRecurringClassesBySubscriptionId = async () => {
      try {
        const data = await getRecurringClassesBySubscriptionId(subscriptionId);
        setRecurringClassesData(data);

        // Set the initial selected children' id
        const initialSelectedChildrenIds = data.recurringClasses.map(
          (recurringClass: RecurringClass) => {
            const set = new Set<number>();
            recurringClass.recurringClassAttendance.forEach((attendee: any) => {
              set.add(attendee.childrenId);
            });
            return set;
          },
        );
        setSelectedChildrenIds(initialSelectedChildrenIds);

        // Set the initial selected instructors' id
        const initialSelectedInstructorIds = data.recurringClasses.map(
          (recurringClass: RecurringClass) => recurringClass.instructor.id,
        );
        setSelectedInstructorIds(initialSelectedInstructorIds);

        // TODO: Set the initial selected days
        const days = data.recurringClasses.map(
          (recurringClass: RecurringClass) => "Wed",
        );
        setSelectedDays(days);

        // TODO: Set the initial selected time
        const time = data.recurringClasses.map(
          (recurringClass: RecurringClass) => "16:00",
        );
        setSelectedTimes(time);
      } catch (error) {
        console.error(error);
      }
    };
    fetchRecurringClassesBySubscriptionId();
  }, [subscriptionId]);

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
  }, [customerId]);

  const handleChildChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    changedChildId: number,
    classIndex: number,
  ) => {
    const isChecked = event.target.checked;
    const newSelectedChildrenIds = [...selectedChildrenIds];

    if (isChecked) {
      newSelectedChildrenIds[classIndex].add(changedChildId);
    } else {
      newSelectedChildrenIds[classIndex].delete(changedChildId);
    }
    setSelectedChildrenIds(newSelectedChildrenIds);
  };

  // TODO: When you submit, edit the recurring classes
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (isAdminAuthenticated) {
        // Redirect the user to regular-classes page of admin dashboard
        router.push(`/admins/customer-list/${customerId}`);
        return;
      }

      // Redirect the user to regular-classes page of customer dashboard
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
      <div>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Day</th>
              <th>Time</th>
              <th>Instructor</th>
              <th>Children</th>
              <th>Class Link</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recurringClassesData?.recurringClasses.map(
              (recurringClass, index) => {
                // TODO: Set the day and time of the recurring class.
                const days = ["Mon", "Tue", "Wed"];
                const time = ["16:00", "16:30", "17:00"];

                // TODO: Set instructors' recurring availability

                return (
                  <tr key={recurringClass.id}>
                    <td>{index + 1}</td>
                    <td>
                      <select
                        name="days"
                        value={selectedDays[index]}
                        onChange={(e) => onDayChange(e, index)}
                      >
                        {days.map((day, index) => {
                          return (
                            <option key={index} value={day}>
                              {day}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td>
                      <select
                        name="time"
                        value={selectedTimes[index]}
                        onChange={(e) => onTimeChange(e, index)}
                      >
                        {time.map((time, index) => {
                          return (
                            <option key={index} value={time}>
                              {time}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td>
                      <select
                        name="instructors"
                        value={selectedInstructorIds[index]}
                        onChange={(e) => onInstructorIdsChange(e, index)}
                      >
                        {instructorsData.map((instructor) => {
                          return (
                            <option key={instructor.id} value={instructor.id}>
                              {instructor.name}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td>
                      {children.map((child) => {
                        return (
                          <label
                            key={child.id}
                            htmlFor={`child-${index}-${child.id}`}
                          >
                            <input
                              type="checkbox"
                              id={`child-${index}-${child.id}`}
                              checked={selectedChildrenIds[index].has(child.id)}
                              onChange={(event) =>
                                handleChildChange(event, child.id, index)
                              }
                            />
                            {child.name}
                          </label>
                        );
                      })}
                    </td>
                    {/* <td>{recurringClass.instructor.class_link}</td> */}
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
      <div>
        {isAdminAuthenticated ? (
          <Link href={`/admins/customer-list/${customerId}`}>Back</Link>
        ) : (
          <Link href={`/customers/${customerId}/regular-classes`}>Back</Link>
        )}
        <button type="submit">Confirm</button>
      </div>
    </form>
  );
}

export default EditRegularClassForm;
