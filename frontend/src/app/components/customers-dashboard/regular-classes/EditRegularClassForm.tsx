"use client";

import { getInstructors } from "@/app/helper/instructorsApi";
import { useEffect, useState } from "react";
import { getChildrenByCustomerId } from "@/app/helper/childrenApi";
import {
  editRecurringClass,
  getRecurringClassesBySubscriptionId,
} from "@/app/helper/recurringClassesApi";
import RecurringClassEntry from "./RecurringClassEntry";
import { useRouter } from "next/navigation";
import { formatTime, getWeekday } from "@/app/helper/dateUtils";
import Link from "next/link";

function EditRegularClassForm({
  customerId,
  subscriptionId,
  isAdminAuthenticated,
}: {
  customerId: string;
  subscriptionId: number;
  isAdminAuthenticated?: boolean;
}) {
  const [instructorsData, setInstructorsData] = useState<Instructors>();
  const [children, setChildren] = useState<Child[] | undefined>([]);
  const [states, setStates] = useState<RecurringClassState[]>([]);
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

    const createInitialStates = async () => {
      try {
        // TODO: Get only valid recurring classes.
        const data = await getRecurringClassesBySubscriptionId(subscriptionId);

        // Select recurringClasses whose endAt is null.
        const recurringClasses = data.recurringClasses.filter(
          (recurringClass: RecurringClass) => recurringClass.endAt === null,
        );

        const stateList = recurringClasses.map(
          ({
            id,
            dateTime,
            instructorId,
            instructor,
            childrenIds,
          }: RecurringClass) => {
            let day = null;
            let time = null;

            if (dateTime) {
              day = getWeekday(new Date(dateTime), "Asia/Tokyo");
              time = formatTime(new Date(dateTime), "Asia/Tokyo");
            }

            return {
              id,
              day,
              time,
              instructorId,
              childrenIds,
            };
          },
        );

        // TODO: Get instructors' availability.

        setStates(stateList);
      } catch (error) {
        console.error(error);
      }
    };

    fetchInstructors();
    fetchChildrenByCustomerId(customerId);
    createInitialStates();
  }, [customerId]);

  const onClickHandler = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    state: RecurringClassState,
    startDate: string,
  ) => {
    event.preventDefault();

    try {
      const data = await editRecurringClass(
        state.id,
        subscriptionId,
        customerId,
        state,
        startDate,
      );
      alert(data.message);

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
    <div>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Day</th>
            <th>Time</th>
            <th>Instructor</th>
            <th>Children</th>
            <th>Start From</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {states.map((state, index) => (
            <RecurringClassEntry
              key={index}
              state={state}
              setState={(state: RecurringClassState) => {
                const newStates = [...states];
                newStates[index] = state;
                setStates(newStates);
              }}
              instructorsData={instructorsData}
              childList={children}
              index={index}
              onClickHandler={onClickHandler}
            />
          ))}
        </tbody>
      </table>
      <div>
        {isAdminAuthenticated ? (
          <Link href={`/admins/customer-list/${customerId}`}>Back</Link>
        ) : (
          <Link href={`/customers/${customerId}/regular-classes`}>Back</Link>
        )}
      </div>
    </div>
  );
}

export default EditRegularClassForm;
