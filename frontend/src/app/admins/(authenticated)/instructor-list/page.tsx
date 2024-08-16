"use client";

import { FormEvent, ChangeEvent, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import UsersTable from "@/app/components/admins-dashboard/UsersTable";

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
  const userType = "Instructor List";
  const omitItems = [""]; // Omit the item from the table
  const linkItems = ["ID"]; // Set the item to be a link
  const replaceItems = ["ID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = ["/admins/instructor-list/[ID]"]; // Set the link URL
  const addUserLink = ["/admins/instructor-list/register", "Add instructor"]; // Set the link URL and name to add a user

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isLoading } = useAuth(endpoint, redirectPath);

  // Display a loading message while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <UsersTable
        userType={userType}
        omitItems={omitItems}
        linkItems={linkItems}
        linkUrls={linkUrls}
        replaceItems={replaceItems}
        addUserLink={addUserLink}
      />
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
