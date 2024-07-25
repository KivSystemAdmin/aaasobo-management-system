import { useEffect, useState } from "react";
import ScheduleCalendar from "@/app/components/admins-dashboard/ScheduleCalendar";
import { SlotsOfDays } from "@/app/helper/instructorsApi";

import {
  getInstructorRecurringAvailability,
  getInstructors,
} from "@/app/helper/instructorsApi";
type Instructor = {
  id: number;
  name: string;
  recurringAvailabilities: SlotsOfDays;
};

export default function InstructorScheduleCalendar() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState(1);
  // TODO: set an appropriate default value.
  const [selectedDate, setSelectedDate] = useState("2024-07-01");
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
    (async () => {
      const instructors = await getInstructors();
      if (instructors.length === 0) {
        throw new Error("No instructors found.");
      }
      setInstructors(instructors);
      setSelectedInstructorId(instructors[0].id);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const instructor = await getInstructorRecurringAvailability(
        selectedInstructorId,
        selectedDate,
      );
      if ("message" in instructor) {
        alert(instructor.message);
        return;
      }
      setSlots(instructor.recurringAvailabilities);
    })();
  }, [selectedInstructorId, selectedDate]);

  const selectInstructor = (id: number) => {
    setSelectedInstructorId(id);
  };

  const save = async () => {
    // TODO: Call API to save the schedule.
  };

  return (
    <>
      <InstructorSelect
        instructors={instructors}
        id={selectedInstructorId}
        onChange={selectInstructor}
      />
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
        <input type="date" />
      </label>
      <button onClick={save}>Save</button>
    </>
  );
}

function InstructorSelect({
  instructors,
  id,
  onChange,
}: {
  instructors: Instructor[];
  id: number;
  onChange: (id: number) => void;
}) {
  return (
    <>
      <select value={id} onChange={(e) => onChange(parseInt(e.target.value))}>
        {instructors.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </>
  );
}
