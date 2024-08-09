"use client";

import { useEffect, useState } from "react";
import { getInstructors } from "@/app/helper/instructorsApi";
import ActionButton from "@/app/components/ActionButton";

function InstructorSearch({
  handleSendInstructor,
}: {
  handleSendInstructor: (id: number, name: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Instructor[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<number>(0);

  // Show the autocomplete list when the user types in the search bar.
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setSearchTerm(input);

    if (input.length === 0) {
      setSuggestions([]);
      return;
    }
    const filteredInstructors = instructors.filter((instructor) =>
      instructor.name.toLowerCase().includes(input.toLowerCase()),
    );
    setSuggestions(filteredInstructors);
  };

  // Store a selected instructor's ID and name.
  const handleAutocompleteClick = (value: string) => {
    const selectedInstructor = instructors.filter((instructor) =>
      instructor.name.includes(value),
    );

    if (!selectedInstructor) {
      return;
    }

    setSelectedInstructorId(selectedInstructor[0].id);
    setSearchTerm(selectedInstructor[0].name);
    setSuggestions([]);
  };

  const handleUpdateCalendar = () => {
    handleSendInstructor(selectedInstructorId, searchTerm);
    setSearchTerm("");
  };

  // Fetch instructors from the database.
  useEffect(() => {
    (async () => {
      const instructors = await getInstructors();
      if (instructors.length === 0) {
        throw new Error("No instructors found.");
      }
      setInstructors(instructors);
    })();
  }, []);

  return (
    <>
      <input
        type="text"
        placeholder="Search instructors"
        onChange={handleSearch}
        value={searchTerm}
      />
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map((instructor, index) => (
            <li
              key={index}
              onClick={() => handleAutocompleteClick(instructor.name)}
            >
              {instructor.name}
            </li>
          ))}
        </ul>
      )}
      <ActionButton
        onClick={() => handleUpdateCalendar()}
        btnText="Update Calendar"
      />
    </>
  );
}

export default InstructorSearch;
