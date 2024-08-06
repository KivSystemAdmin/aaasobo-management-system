"use client";

import React, { useEffect, useRef, useState } from "react";
import CalendarHeader from "@/app/components/CalendarHeader";
import CalendarView from "@/app/components/CalendarView";
import styles from "./page.module.scss";
import FullCalendar from "@fullcalendar/react";
import { CalendarApi } from "@fullcalendar/core/index.js";
import { getClassStartAndEndTimes } from "@/app/helper/dateUtils";
import { fetchClassesForCalendar } from "@/app/helper/classesApi";
import RedirectButton from "@/app/components/RedirectButton";
import { PlusIcon } from "@heroicons/react/24/outline";

const Page = ({ params }: { params: { id: string } }) => {
  const customerId = parseInt(params.id);
  const [classesForCalendar, setClassesForCalendar] = useState<EventType[]>([]);
  const [calendarApi, setCalendarApi] = useState<CalendarApi | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    if (!customerId) return;

    const fetchData = async () => {
      try {
        const classes: ClassForCalendar[] = await fetchClassesForCalendar(
          customerId,
          "customer",
        );

        const formattedClasses = classes.map((eachClass) => {
          const { start, end } = getClassStartAndEndTimes(
            eachClass.dateTime,
            "Asia/Tokyo",
          );

          const color =
            eachClass.status === "booked"
              ? "#FF0000"
              : eachClass.status === "completed"
                ? "#99FF99"
                : "#C0C0C0";

          const childrenNames = eachClass.classAttendance.children
            .map((child) => child.name)
            .join(", ");

          return {
            classId: eachClass.id,
            start,
            end,
            title: childrenNames,
            color,
            instructorIcon: eachClass.instructor?.icon,
            instructorNickname: eachClass.instructor?.nickname,
          };
        });

        setClassesForCalendar(formattedClasses);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
        alert("Failed to get classes. Please try again.");
      }
    };

    fetchData();
  }, [customerId]);

  useEffect(() => {
    if (calendarRef.current) {
      setCalendarApi(calendarRef.current.getApi());
    }
  }, []);

  return (
    // 'Page' is the parent component of 'CalendarHeader' and 'CalendarView' children components.
    // 'CalendarHeader' and 'CalendarView' are initially independent from each other, but 'Page' can connect them together
    // by passing 'calendarRef' to 'CalendarView' and retrieving the FullCalendar API instance from it and making the API available for 'CalendarHeader'using state
    <div className={styles.calendarContainer}>
      <CalendarHeader calendarApi={calendarApi ?? null} />

      <div className={styles.calendarInstruction}>
        <p className={styles.headerMessage}>
          You can see the details of classes by clicking them.{" "}
          <span
            style={{
              fontSize: "0.8rem",
              borderRadius: "6px",
              padding: "3px 6px",
              color: "white",
              backgroundColor: "#FF0000",
              width: "150px",
            }}
          >
            booked
          </span>{" "}
          <span
            style={{
              fontSize: "0.8rem",
              borderRadius: "6px",
              padding: "3px 6px",
              color: "white",
              backgroundColor: "#99FF99",
              width: "150px",
            }}
          >
            completed
          </span>{" "}
          <span
            style={{
              fontSize: "0.8rem",
              borderRadius: "6px",
              padding: "3px 6px",
              color: "white",
              backgroundColor: "#C0C0C0",
              width: "150px",
            }}
          >
            canceled
          </span>
        </p>

        <RedirectButton
          linkURL={`/customers/${customerId}/classes/book`}
          btnText="Book Class"
          Icon={PlusIcon}
          className="bookBtn"
        />
      </div>

      <CalendarView
        // Create a ref to access the FullCalendar instance in CalendarView;
        ref={calendarRef}
        events={classesForCalendar}
        // TODO: Fetch holidays from the backend
        holidays={["2024-07-29", "2024-07-30", "2024-07-31"]}
        customerId={customerId}
      />
    </div>
  );
};

export default Page;
