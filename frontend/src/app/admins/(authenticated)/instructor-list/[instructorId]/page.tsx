"use client";

import { useEffect, useState } from "react";
import TabFunction from "@/app/components/admins-dashboard/TabFunction";
import InstructorCalendar from "@/app/components/instructors-dashboard/class-schedule/InstructorCalendar";
import InstructorProfile from "@/app/components/instructors-dashboard/instructor-profile/InstructorProfile";
import { useAuth } from "@/app/hooks/useAuth";
import { useTabSelect } from "@/app/hooks/useTabSelect";
import Calendar from "@/app/components/Calendar";
import {
  getInstructor,
  registerUnavailability,
  getInstructorRecurringAvailability,
  addRecurringAvailabilities,
} from "@/app/helper/instructorsApi";
import { SlotsOfDays } from "@/app/helper/instructorsApi";
import ScheduleCalendar from "@/app/components/admins-dashboard/ScheduleCalendar";

function Page({ params }: { params: { instructorId: string } }) {
  const instructorId = params.instructorId;
  const breadcrumb = ["Instructor List", `ID: ${instructorId}`];

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  // Get the active tab from the local storage.
  const { initialActiveTab, isTabInitialized } = useTabSelect(
    "activeInstructorTab",
  );

  // Tabs with labels and content
  const tabs = [
    {
      label: "Class Schedule",
      content: (
        <InstructorCalendar
          id={parseInt(instructorId)}
          isAdminAuthenticated={isAuthenticated}
        />
      ),
    },
    {
      label: "Instructor's Profile",
      content: (
        <InstructorProfile
          instructorId={instructorId}
          isAdminAuthenticated={isAuthenticated}
        />
      ),
    },
    {
      label: "Instructor's Availability",
      content: (
        <AvailabilityCalendarWrapper instructorId={parseInt(instructorId)} />
      ),
    },
    {
      label: "Instructor's Schedule",
      content: <InstructorSchedule instructorId={parseInt(instructorId)} />,
    },
  ];

  // Display a loading message while checking the authentication and initializing the tab.
  if (isLoading || !isTabInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <TabFunction
      tabs={tabs}
      breadcrumb={breadcrumb}
      initialActiveTab={initialActiveTab}
    />
  );
}

function AvailabilityCalendarWrapper({
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
  return <AvailabilityCalendar instructor={instructor} />;
}

function AvailabilityCalendar({ instructor }: { instructor: Instructor }) {
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
        <button onClick={submit}>Register Unavailability</button>
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
  const availabilities = toEvents(instructor?.availabilities ?? []);
  const unavailabilities = toEvents(instructor?.unavailabilities ?? [], "gray");
  return [...availabilities, ...unavailabilities];
}

function InstructorSchedule({ instructorId }: { instructorId: number }) {
  const [selectedDate, setSelectedDate] = useState("2024-07-01");
  const [startFrom, setStartFrom] = useState("2024-08-01");
  const [slots, setSlots] = useState<SlotsOfDays>({
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: [],
  });

  const fetchData = async () => {
    const instructor = await getInstructorRecurringAvailability(
      instructorId,
      selectedDate,
    );
    if ("message" in instructor) {
      alert(instructor.message);
      return;
    }
    setSlots(instructor.recurringAvailabilities);
  };

  useEffect(() => {
    fetchData();
  }, [instructorId, selectedDate]);

  const save = async () => {
    await addRecurringAvailabilities(instructorId, slots, startFrom);
    await fetchData();
  };

  return (
    <>
      <label>
        Date
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </label>
      <ScheduleCalendar slotsOfDays={slots} setSlotsOfDays={setSlots} />
      <label>
        Start From
        <input
          type="date"
          value={startFrom}
          onChange={(e) => setStartFrom(e.target.value)}
        />
      </label>
      <button onClick={save}>Save</button>
    </>
  );
}

export default Page;
