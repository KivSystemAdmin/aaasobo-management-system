"use client";

import React, { useEffect, useRef, useState } from "react";
import CalendarHeader from "@/app/components/CalendarHeader";
import CalendarView from "@/app/components/CalendarView";
import styles from "./page.module.scss";
import FullCalendar from "@fullcalendar/react";
import { CalendarApi } from "@fullcalendar/core/index.js";
import { getClassStartAndEndTimes } from "@/app/helper/dateUtils";
import { fetchClassesForCalendar } from "@/app/helper/classesApi";
import { fetchInstructorAvailabilities } from "@/app/helper/instructorsApi";

const Page = ({ params }: { params: { id: string } }) => {
  const instructorId = parseInt(params.id);
  const [allEvents, setAllEvents] = useState<EventType[]>([]);
  const [calendarApi, setCalendarApi] = useState<CalendarApi | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    if (!instructorId) return;

    const fetchData = async () => {
      try {
        const classes: ClassForCalendar[] = await fetchClassesForCalendar(
          instructorId,
          "instructor",
        );

        // Display just 'booked' and 'completed' classes, not 'canceledByCustomer/Instructor' classes
        const classesToDisplay = classes.filter(
          (eachClass) =>
            eachClass.status === "booked" || eachClass.status === "completed",
        );

        const formattedClasses = classesToDisplay.map((eachClass) => {
          const { start, end } = getClassStartAndEndTimes(
            eachClass.dateTime,
            "Asia/Manila",
          );

          const color = eachClass.status === "booked" ? "#FF0000" : "#C0C0C0";

          const childrenNames = eachClass.classAttendance.children
            .map((child) => child.name)
            .join(", ");

          return {
            classId: eachClass.id,
            start,
            end,
            title: childrenNames,
            color,
          };
        });

        // TODO: Update fetchInstructorAvailabilities function
        const instructorAvailabilities: string[] =
          await fetchInstructorAvailabilities(instructorId);

        const formattedAvailabilities = instructorAvailabilities.map(
          (availability) => {
            const { start, end } = getClassStartAndEndTimes(
              availability,
              "Asia/Manila",
            );

            return {
              start,
              end,
              title: "No booked class",
              color: "#66FF66",
            };
          },
        );

        setAllEvents([...formattedClasses, ...formattedAvailabilities]);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
        alert("Failed to get classes. Please try again.");
      }
    };

    fetchData();
  }, [instructorId]);

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
            backgroundColor: "#C0C0C0",
            width: "150px",
          }}
        >
          completed
        </span>
      </p>

      <CalendarView
        // Create a ref to access the FullCalendar instance in CalendarView;
        ref={calendarRef}
        events={allEvents}
        // TODO: Fetch holidays from the backend
        holidays={["2024-07-29", "2024-07-30", "2024-07-31"]}
        instructorId={instructorId}
      />
    </div>
  );
};

export default Page;
