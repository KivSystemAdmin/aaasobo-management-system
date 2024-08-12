"use client";

import { useEffect } from "react";
import ClassDetails from "@/app/components/instructors-dashboard/class-schedule/ClassDetails";
import { useAuth } from "@/app/hooks/useAuth";

const Page = ({
  params,
}: {
  params: { instructorId: string; classId: string };
}) => {
  const instructorId = parseInt(params.instructorId);
  const classId = parseInt(params.classId);

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  useEffect(() => {
    // Set the active tab to the class schedule tab.
    localStorage.setItem("activeInstructorTab", "0");
  }, []);

  // Display a loading message while checking the authentication.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ClassDetails
      instructorId={instructorId}
      classId={classId}
      isAdminAuthenticated={isAuthenticated}
    />
  );
};

export default Page;
