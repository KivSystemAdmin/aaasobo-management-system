"use client";

import React, { useEffect, useState } from "react";
import {
  InstructorSelect,
  useInstructorSelect,
} from "../../admins-dashboard/InstructorSelect";
import ScheduleCalendar from "../../admins-dashboard/ScheduleCalendar";
import {
  Day,
  fetchInstructorRecurringAvailabilities,
  SlotsOfDays,
} from "@/app/helper/instructorsApi";
import { formatTime, getWeekday } from "@/app/helper/dateUtils";
import styles from "./InstructorsSchedule.module.scss";

function InstructorsSchedule() {
  const [instructors, selectedInstructorId, onSelectedInstructorIdChange] =
    useInstructorSelect();
  const [slots, setSlots] = useState<SlotsOfDays>({
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: [],
  });

  useEffect(() => {
    const fetchInstructorAvailabilities = async () => {
      try {
        // Clear previous slots
        setSlots({
          Mon: [],
          Tue: [],
          Wed: [],
          Thu: [],
          Fri: [],
          Sat: [],
          Sun: [],
        });

        const data =
          await fetchInstructorRecurringAvailabilities(selectedInstructorId);

        data.forEach((availability: RecurringAvailability) => {
          const day = getWeekday(
            new Date(availability.startAt),
            "Asia/Tokyo",
          ) as Day;
          const time = formatTime(new Date(availability.startAt), "Asia/Tokyo");

          setSlots((prevSlots) => ({
            ...prevSlots,
            [day]: [...prevSlots[day], time],
          }));
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchInstructorAvailabilities();
  }, [selectedInstructorId]);

  return (
    <div>
      <h3 className={styles.subheading}>Check Instructor&apos;s Schedule</h3>
      <div className={styles.container}>
        <InstructorSelect
          instructors={instructors}
          id={selectedInstructorId}
          onChange={onSelectedInstructorIdChange}
        />
        <ScheduleCalendar slotsOfDays={slots} setSlotsOfDays={setSlots} />
      </div>
    </div>
  );
}

export default InstructorsSchedule;
