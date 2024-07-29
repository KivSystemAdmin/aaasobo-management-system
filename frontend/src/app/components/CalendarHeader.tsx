"use client";

import React, { useEffect, useState } from "react";
import { CalendarApi } from "@fullcalendar/core";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import styles from "./CalendarHeaderView.module.scss";
import clsx from "clsx";

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

  const handleViewChange = (
    view: "dayGridMonth" | "timeGridWeek" | "timeGridDay",
  ) => {
    calendarApi?.changeView(view);
    setCurrentView(view);
  };

  return (
    <div className={styles.headerToolbar}>
      <div className={styles.toolbarSection}>
        <button className={styles.fcButton} onClick={handlePrev}>
          <ChevronLeftIcon className={styles.icon} />
        </button>
        <button className={styles.fcButton} onClick={handleToday}>
          Today
        </button>
        <button className={styles.fcButton} onClick={handleNext}>
          <ChevronRightIcon className={styles.icon} />
        </button>
      </div>

      <div className={styles.fcToolbarTitle}>{viewTitle}</div>

      <div className={styles.toolbarSection}>
        <button
          className={clsx(styles.fcButton, {
            [styles.active]: currentView === "dayGridMonth",
          })}
          onClick={() => handleViewChange("dayGridMonth")}
        >
          Month
        </button>
        <button
          className={clsx(styles.fcButton, {
            [styles.active]: currentView === "timeGridWeek",
          })}
          onClick={() => handleViewChange("timeGridWeek")}
        >
          Week
        </button>
        <button
          className={clsx(styles.fcButton, {
            [styles.active]: currentView === "timeGridDay",
          })}
          onClick={() => handleViewChange("timeGridDay")}
        >
          Day
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;
