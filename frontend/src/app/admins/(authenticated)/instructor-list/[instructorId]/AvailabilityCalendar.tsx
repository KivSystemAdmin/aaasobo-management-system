import { useEffect, useState } from "react";
import Calendar from "@/app/components/Calendar";
import {
  getInstructor,
  registerUnavailability,
} from "@/app/helper/instructorsApi";
import ActionButton from "@/app/components/ActionButton";

export default function AvailabilityCalendar({
  instructorId,
}: {
  instructorId: number;
}) {
  const [instructor, setInstructor] = useState<Instructor | undefined>();

  useEffect(() => {
    (async () => {
      const instructor = await getInstructor(instructorId);
      if ("message" in instructor) {
        alert(instructor.message);
        return;
      }
      setInstructor(instructor.instructor);
    })();
  }, [instructorId]);

  if (!instructor) {
    return <>Loading...</>;
  }
  return <AvailabilityCalendarInternal instructor={instructor} />;
}

function AvailabilityCalendarInternal({
  instructor,
}: {
  instructor: Instructor;
}) {
  const [selectedEvent, setSelectedEvent] = useState("");

  const events = buildEvents(instructor);

  const submit = async () => {
    const res = await registerUnavailability(instructor.id, selectedEvent);
    if ("message" in res) {
      alert(res.message);
      return;
    }
  };

  return (
    <>
      <Calendar
        events={events}
        selectable={true}
        select={(info) => setSelectedEvent(info.startStr)}
      />
      <>
        {/* Show dummy date to stabilize the position of those elements. */}
        <p>{selectedEvent ? selectedEvent : "0000-00-00T00:00:00+09:00"}</p>
        <ActionButton
          className="addBtn"
          onClick={submit}
          btnText="Register Unavailability"
        />
      </>
    </>
  );
}

function buildEvents(instructor: Instructor | undefined) {
  const toEvents = (availabilities: { dateTime: string }[], color?: string) =>
    availabilities.map((dateTime) => {
      const start = dateTime.dateTime;
      const end = new Date(
        new Date(start).getTime() + 25 * 60000,
      ).toISOString();
      return {
        id: start,
        start,
        end,
        color,
      };
    });
  const availabilities = toEvents(instructor?.availabilities ?? [], "#66FF66");
  const unavailabilities = toEvents(
    instructor?.unavailabilities ?? [],
    "#b5c4ab",
  );
  return [...availabilities, ...unavailabilities];
}
