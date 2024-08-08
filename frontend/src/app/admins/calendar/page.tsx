"use client";

import InstructorCalendar from "@/app/components/instructors-dashboard/class-schedule/InstructorCalendar";
import { useAuth } from "@/app/hooks/useAuth";

const Page = ({ params }: { params: { id: string } }) => {
  const instructorId = params.id;

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  // Display a loading message while checking authentication.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <InstructorCalendar
      id={instructorId}
      isAdminAuthenticated={isAuthenticated}
    />
  );
};

export default Page;
