"use client";

import { FormEvent, ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import UsersTable from "@/app/components/admins-dashboard/UsersTable";
import {
  addAvailability,
  addRecurringAvailability,
} from "@/app/helper/instructorsApi";

function useNumberInput(
  initialValue: number,
): [number, (e: ChangeEvent<HTMLInputElement>) => void] {
  const [value, setValue] = useState(initialValue.toString());
  const onChange = (e: ChangeEvent<HTMLInputElement>) =>
    setValue(e.target.value);
  const num = parseInt(value);
  return [isNaN(num) ? 0 : num, onChange];
}

function Page() {
  const userType = "instructor";
  const router = useRouter();

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const result = useAuth(endpoint);
  const { isAuthenticated, isLoading } = result;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admins/login");
    }
  }, [isAuthenticated, router]);

  // Display a loading message while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <UsersTable userType={userType} />
      <AddScheduleForm />
      <CreateCalendarForm />
    </div>
  );
}

function AddScheduleForm() {
  const [instructorId, onInstructorIdChange] = useNumberInput(1);
  const [day, setDay] = useState("1");
  const [time, setTime] = useState("09:00");
  const [startDate, setDate] = useState("2024-07-01");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await addRecurringAvailability(
      instructorId,
      parseInt(day),
      time,
      startDate,
    );
    if ("message" in res) {
      alert(res.message);
    }
  };

  return (
    <form onSubmit={submit}>
      Add Instructor Schedule
      <br />
      <label>
        Instructor ID:
        <input
          type="number"
          value={instructorId}
          onChange={onInstructorIdChange}
        />
      </label>
      <select value={day} onChange={(e) => setDay(e.target.value)}>
        <option value="1">Monday</option>
        <option value="2">Tuesday</option>
        <option value="3">Wednesday</option>
        <option value="4">Thursday</option>
        <option value="5">Friday</option>
        <option value="6">Saturday</option>
      </select>
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
      <label>
        Start Date
        <input
          type="date"
          value={startDate}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}

function CreateCalendarForm() {
  const [instructorId, onInstructorIdChange] = useNumberInput(1);
  const [from, setFrom] = useState("2024-08-01");
  const [until, setUntil] = useState("2024-08-31");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await addAvailability(instructorId, from, until);
    if ("message" in res) {
      alert(res.message);
    }
  };

  return (
    <form onSubmit={submit}>
      Create Availability Calendar
      <br />
      <label>
        Instructor ID
        <input
          type="number"
          value={instructorId}
          onChange={onInstructorIdChange}
        />
      </label>
      <label>
        From
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </label>
      <label>
        Until
        <input
          type="date"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
        />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}

export default Page;
