"use client";

import { useEffect, useState } from "react";
import InstructorCalendar from "@/app/components/instructors-dashboard/class-schedule/InstructorCalendar";
import InstructorSearch from "@/app/components/admins-dashboard/InstructorSearch";
import { useAuth } from "@/app/hooks/useAuth";

const Page = () => {
  const [instructorId, setInstructorId] = useState<number | null>(null);
  const [instructorName, setInstructorName] = useState<string | null>(null);

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  const handleSendInstructor = async (id: number, name: string) => {
    localStorage.setItem("activeInstructor", [String(id), name].join(","));
    setInstructorId(id);
    setInstructorName(name);
  };

  useEffect(() => {
    const activeInstructor = localStorage.getItem("activeInstructor");

    if (activeInstructor === null) {
      return;
    }
    const [id, name] = activeInstructor.split(",");
    setInstructorId(parseInt(id));
    setInstructorName(name);
  }, []);

  // Display a loading message while checking authentication.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isAuthenticated && (
        <InstructorSearch handleSendInstructor={handleSendInstructor} />
      )}
      <InstructorCalendar
        id={instructorId}
        name={instructorName}
        isAdminAuthenticated={isAuthenticated}
      />
    </>
  );
};

export default Page;
