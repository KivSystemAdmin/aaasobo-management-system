import React, { useRef, forwardRef, useImperativeHandle } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import styles from "./CalendarHeaderView.module.scss";
import {
  CalendarApi,
  DayCellContentArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";

type InstructorCalendarViewProps = {
  events: Array<{
    classId?: number;
    title: string;
    start: string;
    end: string;
    color: string;
    childrendData?: {
      id: number;
      name: string;
      birthdate: string;
    }[];
  }>;
  holidays: string[];
};

type CalendarViewRefType = {
  getApi: () => CalendarApi;
};

// Defines the CalendarView component using forwardRef to pass a ref down to FullCalendar
const CalendarView = forwardRef<
  CalendarViewRefType,
  InstructorCalendarViewProps
>(({ events, holidays }, ref) => {
  const calendarRef = useRef<FullCalendar | null>(null);

  // Uses useImperativeHandle to define the getApi method and expose it to the parent Page component
  useImperativeHandle(ref, () => ({
    getApi: () => {
      const api = calendarRef.current?.getApi();
      if (!api) {
        throw new Error("Calendar API is not available.");
      }
      return api;
    },
  }));

  // Formats and displays the content of an event on the calendar view page
  const renderEventContent = (eventInfo: EventContentArg) => {
    const startDate = new Date(eventInfo.event.startStr);
    const hours = String(startDate.getHours()).padStart(2, "0");
    const minutes = String(startDate.getMinutes()).padStart(2, "0");
    const formattedStartTime = `${hours}:${minutes}`;

    const isClickable = eventInfo.event.title !== "No booked class";

    return (
      <div
        className={styles.eventBlock}
        style={{ cursor: isClickable ? "pointer" : "default" }}
      >
        <div className={styles.eventTime}>
          <b>{formattedStartTime}</b> -
        </div>
        <div className={styles.eventTitle}>{eventInfo.event.title}</div>
      </div>
    );
  };

  // Applies custom styles to calendar cells based on holiday dates
  const dayCellDidMount = (info: DayCellContentArg) => {
    const date = new Date(info.date);
    const formattedDate = date.toISOString().split("T")[0];

    if (!holidays.includes(formattedDate)) {
      return;
    }
    info.el.classList.add(styles.holidayCell);
    const dayNumber = info.el.querySelector(".fc-daygrid-day-number");
    if (dayNumber) {
      dayNumber.classList.add(styles.holidayDateNumber);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (clickInfo.event.title !== "No booked class") {
      // TODO: navigate the instructor to the detail page of the clicked class
      const classId = clickInfo.event.extendedProps.classId;
      console.log("Clicked event classId:", classId);
    }
    // router.push(`http://localhost:3000/instructors/[id]/[classId]`);
  };

  const validRange = () => {
    const now = new Date();
    // TODO: 'start' should be the Instructor's 'createdDate'
    const start = new Date(2024, 0, 1);
    // The calendar can be viewed until the end of the month, two months ahead.
    const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={false}
      views={{
        timeGridWeek: {
          slotMinTime: "09:00:00",
          slotMaxTime: "21:30:00",
          slotLabelFormat: {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          },
        },
        timeGridDay: {
          slotMinTime: "09:00:00",
          slotMaxTime: "21:30:00",
          slotLabelFormat: {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          },
        },
      }}
      events={events}
      eventClick={handleEventClick}
      eventContent={renderEventContent}
      validRange={validRange}
      dayCellDidMount={dayCellDidMount}
      locale="en"
      contentHeight="auto"
      dayMaxEvents={true}
      editable={true}
      selectable={false}
      eventDisplay="block"
      allDaySlot={false}
    />
  );
});

export default CalendarView;
