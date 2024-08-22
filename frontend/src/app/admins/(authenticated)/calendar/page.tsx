"use client";

import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/app/admins/(authenticated)/authContext";
import InstructorCalendar from "@/app/components/instructors-dashboard/class-schedule/InstructorCalendar";
import InstructorSearch from "@/app/components/admins-dashboard/InstructorSearch";

const Page = () => {
  const [instructorId, setInstructorId] = useState<number | null>(null);
  const [instructorName, setInstructorName] = useState<string | null>(null);

  // Check the authentication of the admin.
  const { isAuthenticated } = useContext(AuthContext);

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
