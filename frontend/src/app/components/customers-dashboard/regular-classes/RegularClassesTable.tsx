"use client";

import { formatTime, getEndTime, getWeekday } from "@/app/helper/dateUtils";
import { getRecurringClassesBySubscriptionId } from "@/app/helper/recurringClassesApi";
import React, { useEffect, useState } from "react";

function RegularClassesTable({ subscriptionId }: { subscriptionId: number }) {
  const [recurringClassesData, setRecurringClassesData] = useState<
    RecurringClass[] | null
  >(null);

  useEffect(() => {
    const fetchRecurringClassesBySubscriptionId = async () => {
      try {
        const data = await getRecurringClassesBySubscriptionId(subscriptionId);
        setRecurringClassesData(data.recurringClasses);
      } catch (error) {
        console.error(error);
      }
    };
    fetchRecurringClassesBySubscriptionId();
  }, [subscriptionId]);

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
            <th>Class URL</th>
            <th>End Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {recurringClassesData?.map((recurringClass, index) => {
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
              <tr key={recurringClass.id}>
                <td>{index + 1}</td>
                <td>{day}</td>
                {startTime !== null ? (
                  <td>
                    {startTime}-{endTime}
                  </td>
                ) : (
                  <td></td>
                )}
                <td>{recurringClass.instructor?.nickname}</td>
                <td>
                  {recurringClass.recurringClassAttendance
                    .map((attendance) => attendance.children.name)
                    .join(", ")}
                </td>
                <td>{recurringClass.instructor?.classURL}</td>
                <td>
                  {recurringClass.endAt
                    ? recurringClass.endAt.toString().split("T")[0]
                    : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default RegularClassesTable;
