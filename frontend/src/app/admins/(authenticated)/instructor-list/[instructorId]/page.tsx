"use client";

import TabFunction from "@/app/components/admins-dashboard/TabFunction";
import InstructorCalendar from "@/app/components/instructors-dashboard/class-schedule/InstructorCalendar";
import InstructorProfile from "@/app/components/instructors-dashboard/instructor-profile/InstructorProfile";
import { useContext } from "react";
import { AuthContext } from "@/app/admins/(authenticated)/authContext";
import { useTabSelect } from "@/app/hooks/useTabSelect";
import AvailabilityCalendar from "./AvailabilityCalendar";
import InstructorSchedule from "./InstructorSchedule";

function Page({ params }: { params: { instructorId: string } }) {
  const instructorId = params.instructorId;
  const breadcrumb = [
    "Instructor List",
    `/admins/instructor-list`,
    `ID: ${instructorId}`,
  ];
  const activeTabName = "activeInstructorTab";

  // Check the authentication of the admin.
  const { isAuthenticated } = useContext(AuthContext);

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

  // Display a loading message while initializing the tab.
  if (!isTabInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <TabFunction
      tabs={tabs}
      breadcrumb={breadcrumb}
      activeTabName={activeTabName}
      initialActiveTab={initialActiveTab}
    />
  );
}

export default Page;
