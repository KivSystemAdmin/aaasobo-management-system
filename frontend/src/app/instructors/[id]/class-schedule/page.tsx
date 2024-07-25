"use client";

import React, { useEffect, useRef, useState } from "react";
import CalendarHeader from "@/app/components/CalendarHeader";
import CalendarView from "@/app/components/CalendarView";
import styles from "./page.module.scss";
import FullCalendar from "@fullcalendar/react";
import { CalendarApi } from "@fullcalendar/core/index.js";
import { getPhilippineClassStartAndEndTimes } from "@/app/helper/dateUtils";

// TODO: Fetch classes from the backend
// TODO: Add the 'birthdate' property to the 'children' table
const classes = [
  {
    id: 2,
    dateTime: "2024-07-22T08:30:00.000Z",
    customer: {
      id: 1,
      name: "Alice",
      email: "alice@example.com",
    },
    instructor: {
      id: 1,
      name: "Helene Gay Santos",
    },
    classAttendance: {
      children: [
        {
          id: 1,
          name: "Peppa",
        },
      ],
    },
    status: "completed",
  },
  {
    id: 1,
    dateTime: "2024-07-22T09:00:00.000Z",
    customer: {
      id: 1,
      name: "Alice",
      email: "alice@example.com",
    },
    instructor: {
      id: 1,
      name: "Helene Gay Santos",
    },
    classAttendance: {
      children: [
        {
          id: 1,
          name: "Peppa",
        },
        {
          id: 2,
          name: "Suzy",
        },
      ],
    },
    status: "booked",
  },
];

const formattedClasses = classes.map((eachClass) => {
  const { start, end } = getPhilippineClassStartAndEndTimes(eachClass.dateTime);

  const color = eachClass.status === "booked" ? "#FF0000" : "#C0C0C0";

  const childrenData = eachClass.classAttendance.children;

  const childrenNames = eachClass.classAttendance.children
    .map((child) => child.name)
    .join(", ");

  return {
    classId: eachClass.id,
    start,
    end,
    title: childrenNames,
    color,
    childrenData,
  };
});

// TODO: Fetch availabilities from the backend
const availabilities = {
  id: 1,
  name: "Helene Gay Santos",
  availabilities: [
    {
      dateTime: "2024-07-22T10:00:00.000Z",
    },
    {
      dateTime: "2024-07-22T10:30:00.000Z",
    },
    {
      dateTime: "2024-07-22T11:00:00.000Z",
    },
    {
      dateTime: "2024-07-22T11:30:00.000Z",
    },
  ],
};

const formattedAvailabilities = availabilities.availabilities.map(
  (availability) => {
    const { start, end } = getPhilippineClassStartAndEndTimes(
      availability.dateTime,
    );

    return {
      start,
      end,
      title: "No booked class",
      color: "#66FF66",
    };
  },
);

const allEvents = [...formattedClasses, ...formattedAvailabilities];

// TODO: Fetch holidays from the backend
const holidays = ["2024-07-29", "2024-07-30", "2024-07-31"];

const Page = () => {
  // 'Page' is the parent component of 'CalendarHeader' and 'CalendarView' children components.
  // 'CalendarHeader' and 'CalendarView' are initially independent from each other, but 'Page' can connect them together
  // by passing 'calendarRef' to 'CalendarView' and retrieving the FullCalendar API instance from it
  // and making the API available for 'CalendarHeader' using state

  // Create a ref to access the FullCalendar instance in CalendarView
  const calendarRef = useRef<FullCalendar | null>(null);
  const [calendarApi, setCalendarApi] = useState<CalendarApi | null>(null);

  useEffect(() => {
    // Once CalendarView is mounted and calendarRef.current is available, retrieve the FullCalendar API instance and set it in the state
    if (calendarRef.current) {
      setCalendarApi(calendarRef.current.getApi());
    }
  }, []);

  return (
    <div className={styles.calendarContainer}>
      {/* API methods enable CalendarHeader to control the calendar. */}
      <CalendarHeader calendarApi={calendarApi} />

      <p className={styles.headerMessage}>
        You can see the details of classes by clicking them.
      </p>

      <CalendarView
        // Pass the ref to CalendarView to get access to the FullCalendar instance inside it
        ref={calendarRef}
        events={allEvents}
        holidays={holidays}
      />
    </div>
  );
};

export default Page;
