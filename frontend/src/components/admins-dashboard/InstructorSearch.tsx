"use client";

import { useEffect, useState } from "react";
import styles from "./InstructorSearch.module.scss";
import { getInstructors } from "@/lib/api/instructorsApi";
import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";

function InstructorSearch({
  handleSendInstructor,
}: {
  handleSendInstructor: (id: number, name: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Instructor[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<
    number | null
  >(null);

  // Show the autocomplete list when the user types in the search bar.
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setSearchTerm(input);
    setSelectedInstructorId(null);

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
  const handleAutocompleteClick = (instructor: Instructor) => {
    setSelectedInstructorId(instructor.id);
    setSearchTerm(instructor.name);
    setSuggestions([]);
  };

  const handleUpdateCalendar = () => {
    if (selectedInstructorId === null) return;

    handleSendInstructor(selectedInstructorId, searchTerm);
    setSelectedInstructorId(null);
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

      const storedInstructorId = Number.parseInt(
        localStorage.getItem("activeInstructor")?.split(",")[0] ?? "",
        10,
      );
      const activeInstructor = instructors.find(
        (instructor: Instructor) => instructor.id === storedInstructorId,
      );

      if (activeInstructor) {
        handleSendInstructor(activeInstructor.id, activeInstructor.name);
      } else {
        localStorage.removeItem("activeInstructor");
      }
    })();
  }, [handleSendInstructor]);

  return (
    <>
      <div className={styles.filterContainer}>
        <input
          type="text"
          placeholder="Search instructors..."
          onChange={handleSearch}
          value={searchTerm}
        />
        {suggestions.length > 0 && (
          <ul>
            {suggestions.map((instructor) => (
              <li
                key={instructor.id}
                onClick={() => handleAutocompleteClick(instructor)}
              >
                {instructor.name}
              </li>
            ))}
          </ul>
        )}
        <ActionButton
          onClick={() => handleUpdateCalendar()}
          btnText="Display Calendar"
          className="bookBtn"
          disabled={selectedInstructorId === null}
        />
      </div>
    </>
  );
}

export default InstructorSearch;
