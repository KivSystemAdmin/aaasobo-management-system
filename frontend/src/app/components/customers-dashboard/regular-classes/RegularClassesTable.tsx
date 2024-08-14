"use client";

import { formatTime, getEndTime, getWeekday } from "@/app/helper/dateUtils";
import { getRecurringClassesBySubscriptionId } from "@/app/helper/recurringClassesApi";
import React, { useEffect, useState } from "react";
import ActionButton from "../../ActionButton";
import { useRouter } from "next/navigation";
import styles from "./RegularClassesTable.module.scss";
import { CheckCircleIcon, ArrowUpCircleIcon } from "@heroicons/react/24/solid";

function RegularClassesTable({
  subscriptionId,
  isAdminAuthenticated,
  customerId,
}: {
  subscriptionId: number;
  isAdminAuthenticated?: boolean | null;
  customerId: string;
}) {
  const [currRecurringClasses, setCurrRecurringClasses] = useState<
    RecurringClass[]
  >([]);
  const [upcomingRecurringClasses, setUpcomingRecurringClasses] = useState<
    RecurringClass[]
  >([]);
  const router = useRouter();

  useEffect(() => {
    const fetchRecurringClassesBySubscriptionId = async () => {
      try {
        const data = await getRecurringClassesBySubscriptionId(subscriptionId);

        // Get the local date and the begging of its time.
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        const today = date.toISOString().split("T")[0];

        const curr: RecurringClass[] = [];
        const upcoming: RecurringClass[] = [];

        // Set the current Regular Classes and the up coming Regular Class separately.
        data.recurringClasses.forEach((recurringClass: RecurringClass) => {
          const { dateTime } = recurringClass;
          if (new Date(today + "T00:00:00Z") < new Date(dateTime)) {
            upcoming.push(recurringClass);
          } else {
            curr.push(recurringClass);
          }
        });

        setCurrRecurringClasses(curr);
        setUpcomingRecurringClasses(upcoming);
      } catch (error) {
        console.error(error);
      }
    };
    fetchRecurringClassesBySubscriptionId();
  }, [subscriptionId]);

  const handleEditRegularClasses = () => {
    if (isAdminAuthenticated) {
      router.push(
        `/admins/customer-list/${customerId}/regular-classes/edit?subscriptionId=${subscriptionId}`,
      );
      return;
    }
    router.push(
      `/customers/${customerId}/regular-classes/edit?subscriptionId=${subscriptionId}`,
    );
  };

  return (
    <div>
      {currRecurringClasses.length > 0 && (
        <div>
          <div className={styles.subheading}>
            <CheckCircleIcon className={styles.icon} />
            <h4>Current Regular Class</h4>
          </div>
          <Table recurringClasses={currRecurringClasses} />
        </div>
      )}
      {upcomingRecurringClasses.length > 0 && (
        <div>
          <div className={styles.subheading}>
            <ArrowUpCircleIcon className={styles.icon} />
            <h4>Upcoming Regular Class</h4>
          </div>
          <Table recurringClasses={upcomingRecurringClasses} />
        </div>
      )}
      <div className={styles.buttonWrapper}>
        <ActionButton
          className="editBtn"
          onClick={handleEditRegularClasses}
          btnText="Edit Regular Classes"
        />
      </div>
    </div>
  );
}

export default RegularClassesTable;

function Table({ recurringClasses }: { recurringClasses: RecurringClass[] }) {
  return (
    <table className={styles.table}>
      <thead className={styles.header}>
        <tr>
          <th></th>
          <th className={styles.headerText}>Instructor</th>
          <th className={styles.headerText}>Day</th>
          <th className={styles.headerText}>Time</th>
          <th className={styles.headerText}>Children</th>
          <th className={styles.headerText}>Class URL</th>
          <th className={styles.headerText}>Start Date</th>
          <th className={styles.headerText}>End Date</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {recurringClasses?.map((recurringClass, index) => {
          let startTime = null;
          let endTime = null;
          let day = null;

          if (recurringClass.dateTime) {
            startTime = formatTime(
              new Date(recurringClass.dateTime),
              "Asia/Tokyo",
            );
            endTime = formatTime(
              getEndTime(new Date(recurringClass.dateTime)),
              "Asia/Tokyo",
            );
            day = getWeekday(new Date(recurringClass.dateTime), "Asia/Tokyo");
          }

          return (
            <tr key={recurringClass.id} className={styles.body}>
              <td className={styles.bodyText}>{index + 1}</td>
              <td className={styles.bodyText}>
                {recurringClass.instructor?.nickname}
              </td>
              <td className={styles.bodyText}>{day}</td>
              {startTime !== null ? (
                <td className={styles.bodyText}>
                  {startTime}-{endTime}
                </td>
              ) : (
                <td></td>
              )}
              <td className={styles.bodyText}>
                {recurringClass.recurringClassAttendance
                  .map((attendance) => attendance.children.name)
                  .join(", ")}
              </td>
              <td className={`${styles.bodyText} ${styles.url}`}>
                <a
                  href={recurringClass.instructor?.classURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  {recurringClass.instructor?.classURL}
                </a>
              </td>
              <td className={styles.bodyText}>
                {recurringClass.dateTime
                  ? recurringClass.dateTime.toString().split("T")[0]
                  : ""}
              </td>
              <td className={styles.bodyText}>
                {recurringClass.endAt
                  ? recurringClass.endAt.toString().split("T")[0]
                  : ""}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
