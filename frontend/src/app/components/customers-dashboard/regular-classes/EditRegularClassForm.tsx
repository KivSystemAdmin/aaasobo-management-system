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
import styles from "./EditRegularClassForm.module.scss";
import RedirectButton from "../../RedirectButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EditRegularClassForm({
  customerId,
  subscriptionId,
  isAdminAuthenticated,
}: {
  customerId: string;
  subscriptionId?: number | null;
  isAdminAuthenticated?: boolean;
}) {
  const [instructorsData, setInstructorsData] = useState<Instructor[]>();
  const [children, setChildren] = useState<Child[] | undefined>([]);
  const [states, setStates] = useState<RecurringClassState[]>([]);
  const [keepStates, setKeepStates] = useState<RecurringClassState[]>([]);
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
      if (!subscriptionId) {
        return;
      }
      try {
        const data = await getRecurringClassesBySubscriptionId(subscriptionId);

        // Select recurringClasses whose endAt is null.
        const recurringClasses = data.recurringClasses.filter(
          (recurringClass: RecurringClass) => recurringClass.endAt === null,
        );

        const stateList = recurringClasses.map(
          ({ id, dateTime, instructorId, childrenIds }: RecurringClass) => {
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

        setStates(stateList);
        setKeepStates(stateList);
      } catch (error) {
        console.error(error);
      }
    };

    fetchInstructors();
    fetchChildrenByCustomerId(customerId);
    createInitialStates();
  }, [customerId, subscriptionId]);

  const onClickHandler = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    state: RecurringClassState,
    startDate: string,
  ) => {
    event.preventDefault();

    // If the start date doesn't have value, return it.
    if (!startDate) {
      toast.warning("Please enter Start From date");
      return;
    }

    // Find the corresponding state in keepStates
    const prevState = keepStates.find((s) => s.id === state.id);
    if (!prevState) {
      console.error("Previous state not found");
      return;
    }

    // If all state values are the same as the previous ones, return it.
    const stateChildren =
      state.childrenIds.size === prevState.childrenIds.size &&
      Array.from(state.childrenIds).every((childId) =>
        Array.from(prevState.childrenIds).includes(childId),
      );
    const stateInstructorId = state.instructorId === prevState.instructorId;
    const stateDay = state.day === prevState.day;
    const stateTime = state.time === prevState.time;

    if (stateChildren && stateInstructorId && stateDay && stateTime) {
      toast.warning("Please select a new instructor, day, time and children");
      return;
    }

    try {
      if (!subscriptionId) {
        return;
      }
      const data = await editRecurringClass(
        state.id,
        subscriptionId,
        customerId,
        state,
        startDate,
      );

      // Set the URL depending on authenticated admin or not.
      const targetURL = isAdminAuthenticated
        ? `/admins/customer-list/${customerId}?message=${encodeURIComponent(data.message)}`
        : `/customers/${customerId}/regular-classes?message=${encodeURIComponent(data.message)}`;

      router.push(targetURL);
    } catch (error) {
      console.error("Failed to edit a new recurring class data:", error);
    }
  };

  if (!instructorsData || !children) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <ToastContainer />
      <table className={styles.table}>
        <thead className={styles.header}>
          <tr>
            <th></th>
            <th className={styles.headerText}>Instructor</th>
            <th className={styles.headerText}>Day</th>
            <th className={styles.headerText}>Time</th>
            <th className={styles.headerText}>Children</th>
            <th className={styles.headerText}>Start Date</th>
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
      <div className={styles.buttonWrapper}>
        {isAdminAuthenticated ? (
          <RedirectButton
            btnText="Back"
            linkURL={`/admins/customer-list/${customerId}`}
            className="backBtn"
          />
        ) : (
          <RedirectButton
            btnText="Back"
            linkURL={`/customers/${customerId}/regular-classes`}
            className="backBtn"
          />
        )}
      </div>
    </div>
  );
}

export default EditRegularClassForm;
