"use client";

import { useEffect, useState } from "react";
import styles from "./InstructorSearch.module.scss";
import { getInstructors } from "@/lib/api/instructorsApi";
import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

function InstructorSearch({
  handleSendInstructor,
  activeInstructorId,
}: {
  handleSendInstructor: (id: number, name: string) => void;
  activeInstructorId: number | null;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Instructor[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
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

  const activeInstructorIndex = instructors.findIndex(
    (instructor) => instructor.id === activeInstructorId,
  );
  const canSelectPrevious = activeInstructorIndex > 0;
  const canSelectNext =
    activeInstructorIndex >= 0 &&
    activeInstructorIndex < instructors.length - 1;

  const selectAdjacentInstructor = (offset: -1 | 1) => {
    const instructor = instructors[activeInstructorIndex + offset];
    if (instructor) {
      handleSendInstructor(instructor.id, instructor.name);
      setSearchTerm("");
      setSelectedInstructorId(null);
      setSuggestions([]);
    }
  };

  // Fetch instructors from the database.
  useEffect(() => {
    (async () => {
      try {
        const instructors = (await getInstructors()).sort(
          (first: Instructor, second: Instructor) => first.id - second.id,
        );
        setInstructors(instructors);

        if (instructors.length === 0) {
          localStorage.removeItem("activeInstructor");
          return;
        }

        const storedInstructorId = Number.parseInt(
          localStorage.getItem("activeInstructor") ?? "",
          10,
        );
        const activeInstructor =
          instructors.find(
            (instructor: Instructor) => instructor.id === storedInstructorId,
          ) ?? instructors[0];

        handleSendInstructor(activeInstructor.id, activeInstructor.name);
      } catch (error) {
        console.error("Failed to load instructors:", error);
        setLoadError("Failed to load instructors. Please try again.");
      } finally {
        setHasLoaded(true);
      }
    })();
  }, [handleSendInstructor]);

  return (
    <>
      <div className={styles.navigationContainer}>
        <button
          type="button"
          className={styles.navigationButton}
          aria-label="Previous instructor"
          disabled={!canSelectPrevious}
          onClick={() => selectAdjacentInstructor(-1)}
        >
          <ChevronLeftIcon />
        </button>
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
        <button
          type="button"
          className={styles.navigationButton}
          aria-label="Next instructor"
          disabled={!canSelectNext}
          onClick={() => selectAdjacentInstructor(1)}
        >
          <ChevronRightIcon />
        </button>
      </div>
      {loadError && <p className={styles.loadError}>{loadError}</p>}
      {!loadError && hasLoaded && instructors.length === 0 && (
        <p className={styles.emptyState}>No active instructors found.</p>
      )}
    </>
  );
}

export default InstructorSearch;
