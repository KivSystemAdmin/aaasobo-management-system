"use client";

import React, { useEffect, useState } from "react";
import { CalendarApi } from "@fullcalendar/core";
import styles from "./CalendarHeaderView.module.scss";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

type CalendarHeaderProps = {
  calendarApi: CalendarApi | null;
};

const CalendarHeader = ({ calendarApi }: CalendarHeaderProps) => {
  const [currentView, setCurrentView] = useState<
    "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  >("dayGridMonth");
  const [viewTitle, setViewTitle] = useState<string>("");

  useEffect(() => {
    if (!calendarApi) {
      return;
    }

    setCurrentView(
      calendarApi.view.type as "dayGridMonth" | "timeGridWeek" | "timeGridDay",
    );
    setViewTitle(calendarApi.view.title);

    const updateViewTitle = () => {
      setViewTitle(calendarApi.view.title);
    };

    // Update title whenever the calendar view changes due to the "datesSet" event
    calendarApi.on("datesSet", updateViewTitle);

    // Clean up event listener
    return () => {
      calendarApi.off("datesSet", updateViewTitle);
    };
  }, [calendarApi]);

  const handlePrev = () => {
    calendarApi?.prev();
  };

  const handleNext = () => {
    calendarApi?.next();
  };

  const handleToday = () => {
    calendarApi?.today();
  };

  return (
    <div className={styles.headerToolbar}>
      <div className={styles.toolbarSection}>
        <ChevronLeftIcon
          className={styles.calendarHeader}
          onClick={handlePrev}
        />

        <button className={styles.todayBtn} onClick={handleToday}>
          This Month
        </button>

        <ChevronRightIcon
          className={styles.calendarHeader}
          onClick={handleNext}
        />
      </div>

      <div className={styles.calendarTitleContainer}>
        <div className={styles.fcToolbarTitle}>{viewTitle}</div>
      </div>
    </div>
  );
};

export default CalendarHeader;
