"use client";

import { formatTime, getEndTime, getWeekday } from "@/app/helper/dateUtils";
import { getRecurringClassesBySubscriptionId } from "@/app/helper/recurringClassesApi";
import React, { useEffect, useState } from "react";

function RegularClassesTable({ subscriptionId }: { subscriptionId: number }) {
  const [currRecurringClasses, setCurrRecurringClasses] = useState<
    RecurringClass[]
  >([]);
  const [upcomingRecurringClasses, setUpcomingRecurringClasses] = useState<
    RecurringClass[]
  >([]);

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

  return (
    <div>
      {currRecurringClasses.length > 0 && (
        <div>
          <h4>Current Regular Class</h4>
          <Table recurringClasses={currRecurringClasses} />
        </div>
      )}
      {upcomingRecurringClasses.length > 0 && (
        <div>
          <h4>Upcoming Regular Class</h4>
          <Table recurringClasses={upcomingRecurringClasses} />
        </div>
      )}
    </div>
  );
}

export default RegularClassesTable;

function Table({ recurringClasses }: { recurringClasses: RecurringClass[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Instructor</th>
          <th>Day</th>
          <th>Time</th>
          <th>Children</th>
          <th>Class URL</th>
          <th>Start From</th>
          <th>End Date</th>
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
            <tr key={recurringClass.id}>
              <td>{index + 1}</td>
              <td>{recurringClass.instructor?.nickname}</td>
              <td>{day}</td>
              {startTime !== null ? (
                <td>
                  {startTime}-{endTime}
                </td>
              ) : (
                <td></td>
              )}
              <td>
                {recurringClass.recurringClassAttendance
                  .map((attendance) => attendance.children.name)
                  .join(", ")}
              </td>
              <td>{recurringClass.instructor?.classURL}</td>
              <td>
                {recurringClass.dateTime
                  ? recurringClass.dateTime.toString().split("T")[0]
                  : ""}
              </td>
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
  );
}
