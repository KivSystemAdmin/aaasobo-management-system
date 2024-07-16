import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import momentTimezonePlugin from "@fullcalendar/moment-timezone";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarOptions } from "@fullcalendar/core";

type BookingRegularClassCalendarProp = {
  selectedInstructor: Instructor;
} & CalendarOptions;

function BookingRegularClassCalendar({
  selectedInstructor,
  ...options
}: BookingRegularClassCalendarProp) {
  // Create the events based on that data.
  const events = selectedInstructor.availabilities.map(
    (availability, index) => {
      const start = availability.dateTime;
      const end = new Date(
        new Date(start).getTime() + 25 * 60000,
      ).toISOString();
      return {
        id: index.toString(),
        start,
        end,
      };
    },
  );

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

export default BookingRegularClassCalendar;
