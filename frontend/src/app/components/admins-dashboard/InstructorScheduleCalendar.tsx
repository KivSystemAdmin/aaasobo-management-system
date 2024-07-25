import { useEffect, useState } from "react";
import ScheduleCalendar, {
  SlotsOfDays,
} from "@/app/components/admins-dashboard/ScheduleCalendar";

type Instructor = {
  id: number;
  name: string;
  recurringAvailabilities: SlotsOfDays;
};

export default function InstructorScheduleCalendar() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState(0);
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
      // TODO: Get real instructors data from API.
      const instructors: Instructor[] = await getDummyInstructors();
      if (instructors.length === 0) {
        throw new Error("No instructors found.");
      }
      setInstructors(instructors);
      setSelectedInstructorId(instructors[0].id);
      setSlots(instructors[0]!.recurringAvailabilities);
    })();
  }, []);

  const selectInstructor = (id: number) => {
    setSelectedInstructorId(id);
    setSlots(instructors.find((i) => i.id === id)!.recurringAvailabilities);
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

// TODO: Replace this with real API call.
async function getDummyInstructors(): Promise<Instructor[]> {
  return Promise.resolve([
    {
      id: 1,
      name: "Helene Gay Santos",
      recurringAvailabilities: {
        Sun: [],
        Mon: ["16:00", "16:30", "17:00", "17:30", "18:00"],
        Tue: ["17:00"],
        Wed: ["17:00"],
        Thu: ["16:00", "16:30", "17:00", "17:30", "18:00"],
        Fri: [],
        Sat: ["09:00", "09:30"],
      },
    },
    {
      id: 2,
      name: "Elian P.Quilisadio",
      recurringAvailabilities: {
        Sun: [],
        Mon: ["18:00", "18:30", "19:00", "19:30", "20:00"],
        Tue: ["18:00", "19:00", "20:00"],
        Wed: ["18:00", "20:00"],
        Thu: [],
        Fri: [],
        Sat: ["09:00", "09:30", "11:30", "12:00"],
      },
    },
  ]);
}
