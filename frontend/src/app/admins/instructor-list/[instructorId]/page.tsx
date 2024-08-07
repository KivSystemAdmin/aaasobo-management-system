"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TabFunction from "@/app/components/admins-dashboard/TabFunction";
import InstructorProfile from "@/app/components/instructors-dashboard/instructor-profile/InstructorProfile";
import { useAuth } from "@/app/hooks/useAuth";
import { useTabSelect } from "@/app/hooks/useTabSelect";

function Page({ params }: { params: { instructorId: string } }) {
  const instructorId = params.instructorId;
  const router = useRouter();

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const { isAuthenticated } = useAuth(endpoint);

  // Get the active tab from the local storage.
  const { initialActiveTab, isTabInitialized } = useTabSelect("activeTab");

  // Tabs with labels and content
  const tabs = [
    {
      label: "Class Schedule",
      content: <div>Class Schedule(ToDo)</div>,
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
      content: <div>Instructor's Availability(ToDo)</div>,
    },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admins/login");
    }
  }, [isAuthenticated, router]);

  // If the tab is not initialized, return null.
  if (!isTabInitialized) {
    return null;
  }

  return <TabFunction tabs={tabs} initialActiveTab={initialActiveTab} />;
}

export default Page;
