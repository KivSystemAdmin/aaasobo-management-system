"use client";

import { FormEvent, ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import UsersTable from "@/app/components/admins-dashboard/UsersTable";
import InstructorScheduleCalendar from "@/app/components/admins-dashboard/InstructorScheduleCalendar";

import { addAvailability } from "@/app/helper/instructorsApi";

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
      <CreateCalendarForm />
      <hr />
      <h2>Instructor Schedule Calendar</h2>
      <InstructorScheduleCalendar />
    </div>
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
