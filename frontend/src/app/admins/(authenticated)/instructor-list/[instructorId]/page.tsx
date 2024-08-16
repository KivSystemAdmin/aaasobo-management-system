"use client";

import TabFunction from "@/app/components/admins-dashboard/TabFunction";
import InstructorCalendar from "@/app/components/instructors-dashboard/class-schedule/InstructorCalendar";
import InstructorProfile from "@/app/components/instructors-dashboard/instructor-profile/InstructorProfile";
import { useAuth } from "@/app/hooks/useAuth";
import { useTabSelect } from "@/app/hooks/useTabSelect";
import AvailabilityCalendar from "./AvailabilityCalendar";
import InstructorSchedule from "./InstructorSchedule";

function Page({ params }: { params: { instructorId: string } }) {
  const instructorId = params.instructorId;
  const breadcrumb = ["Instructor List", `ID: ${instructorId}`];

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  // Get the active tab from the local storage.
  const { initialActiveTab, isTabInitialized } = useTabSelect(
    "activeInstructorTab",
  );

  // Tabs with labels and content
  const tabs = [
    {
      label: "Class Schedule",
      content: (
        <InstructorCalendar
          id={parseInt(instructorId)}
          isAdminAuthenticated={isAuthenticated}
        />
      ),
    },
    {
      label: "Instructor's Profile",
      content: (
        <InstructorProfile
          instructorId={instructorId}
          isAdminAuthenticated={isAuthenticated}
        />
      ),
    },
    {
      label: "Instructor's Availability",
      content: <AvailabilityCalendar instructorId={parseInt(instructorId)} />,
    },
    {
      label: "Instructor's Schedule",
      content: <InstructorSchedule instructorId={parseInt(instructorId)} />,
    },
  ];

  // Display a loading message while checking the authentication and initializing the tab.
  if (isLoading || !isTabInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <TabFunction
      tabs={tabs}
      breadcrumb={breadcrumb}
      initialActiveTab={initialActiveTab}
    />
  );
}

export default Page;
