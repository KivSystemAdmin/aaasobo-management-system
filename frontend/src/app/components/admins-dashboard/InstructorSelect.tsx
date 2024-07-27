import { useEffect, useState } from "react";
import { getInstructors } from "@/app/helper/instructorsApi";
import { SlotsOfDays } from "@/app/helper/instructorsApi";

export type Instructor = {
  id: number;
  name: string;
  availabilities: { dateTime: string }[];
  unavailabilities: { dateTime: string }[];
  recurringAvailabilities: SlotsOfDays;
};

export function useInstructorSelect() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState(1);

  const onSelectedInstructorIdChange = (id: number) => {
    setSelectedInstructorId(id);
  };

  const refresh = async () => {
    const instructors = await getInstructors();
    if (instructors.length === 0) {
      throw new Error("No instructors found.");
    }
    setInstructors(instructors);
    setSelectedInstructorId(instructors[0].id);
  };

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

  return [
    instructors,
    selectedInstructorId,
    onSelectedInstructorIdChange,
    refresh,
  ] as const;
}

export function InstructorSelect({
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
