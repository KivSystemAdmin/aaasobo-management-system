import React from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import momentTimezonePlugin from "@fullcalendar/moment-timezone";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarOptions, EventSourceInput } from "@fullcalendar/core";

type Event = {
  id: string;
  start: string;
  end: string;
  color?: string;
};

type CalendarProp = {
  events: Event[] | EventSourceInput;
  headerRight?: React.ReactNode;
} & CalendarOptions;

function Calendar({ events, headerRight, ...options }: CalendarProp) {
  return (
    <div style={{ position: "relative" }}>
      <FullCalendar
        plugins={[timeGridPlugin, momentTimezonePlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        events={events}
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        timeZone="Asia/Tokyo"
        {...options}
      />
      {headerRight && (
        <div
          style={{
            position: "absolute",
            top: "0",
            right: "0",
            zIndex: 1,
            padding: "10px",
          }}
        >
          {headerRight}
        </div>
      )}
    </div>
  );
}

export default Calendar;
