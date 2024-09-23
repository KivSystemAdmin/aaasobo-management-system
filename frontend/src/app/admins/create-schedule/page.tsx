"use client";

import { createMonthlyClasses } from "@/app/helper/classesApi";
import React, { useState } from "react";

function Page() {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [year, setYear] = useState(new Date().getUTCFullYear());

  // TODO: Make a limitation within 3 months.

  const clickHandler = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();

    try {
      await createMonthlyClasses({ year, month });
      alert("Classes are successfully created.");
    } catch (error) {
      console.error("Failed to Create the schedule", error);
    }
  };

  return (
    <div>
      <div>Select month you want to create a new schedule</div>
      <select
        name="months"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
      >
        {months.map((month, index) => (
          <option key={index} value={month}>
            {month}
          </option>
        ))}
      </select>
      <select
        name="year"
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
      >
        <option value={year}>{year}</option>
      </select>
      <button onClick={clickHandler}>Make Schedule</button>
    </div>
  );
}

export default Page;
