import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import momentTimezonePlugin from "@fullcalendar/moment-timezone";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarOptions } from "@fullcalendar/core";

type Event = {
  id: string;
  start: string;
  end: string;
  color?: string;
};

type CalendarProp = {
  events: Event[];
} & CalendarOptions;

function Calendar({ events, ...options }: CalendarProp) {
  return (
    <FullCalendar
      {...options}
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
    />
  );
}

export default Calendar;
