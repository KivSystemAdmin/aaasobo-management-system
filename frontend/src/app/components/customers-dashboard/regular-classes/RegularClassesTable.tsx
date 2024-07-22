"use client";

import { getRecurringClassesBySubscriptionId } from "@/app/helper/classesApi";
import React, { useEffect, useState } from "react";

function RegularClassesTable({ subscriptionId }: { subscriptionId: number }) {
  const [recurringClassesData, setRecurringClassesData] =
    useState<RecurringClasses | null>(null);

  useEffect(() => {
    const fetchRecurringClassesBySubscriptionId = async () => {
      try {
        const data = await getRecurringClassesBySubscriptionId(subscriptionId);
        setRecurringClassesData(data);
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
            <th>Class Link</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {recurringClassesData?.recurringClasses.map(
            (recurringClass, index) => {
              // TODO: Set the day and time based on the recurring classes.

              return (
                <tr key={recurringClass.id}>
                  <td>{index + 1}</td>
                  <td>Wed</td>
                  <td>16:00-16:30</td>
                  <td>{recurringClass.instructor.name}</td>
                  <td>
                    {recurringClass.recurringClassAttendance
                      .map((child) => child.children.name)
                      .join(", ")}
                  </td>
                  {/* <td>{recurringClass.instructor.class_link}</td> */}
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}

export default RegularClassesTable;
