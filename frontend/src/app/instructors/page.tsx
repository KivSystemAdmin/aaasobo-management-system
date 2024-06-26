"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import Calendar from "../components/Calendar";

const Instructor = () => {
  const [instructorsData, setInstructorsData] = useState<
    Instructors | undefined
  >();
  const [selectedInstructor, setSelectedInstructor] = useState<
    Instructor | undefined
  >();

  useEffect(() => {
    const getInstructors = async () => {
      try {
        const response = await fetch("http://localhost:4000/instructors");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setInstructorsData(data);
      } catch (error) {
        console.error(error);
      }
    };

    getInstructors();
  }, []);

  // Set the instructor data depending on the selected instructor.
  const handleSelectedInstructor = (e: ChangeEvent<HTMLSelectElement>) => {
    if (instructorsData === undefined) {
      return;
    }
    const findInstructor = instructorsData.data.find(
      (instructor) => instructor.id === Number(e.target.value)
    );
    setSelectedInstructor(findInstructor);
  };

  return (
    <div>
      <label id="instructors">Select the instructor</label>
      <select
        name="instructors"
        id="instructors"
        onChange={handleSelectedInstructor}
      >
        <option value="">--Please select the instructor--</option>
        {instructorsData &&
          instructorsData.data.map((instructor: Instructor) => {
            return (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            );
          })}
      </select>
      {selectedInstructor && <Calendar instructor={selectedInstructor} />}
    </div>
  );
};

export default Instructor;
