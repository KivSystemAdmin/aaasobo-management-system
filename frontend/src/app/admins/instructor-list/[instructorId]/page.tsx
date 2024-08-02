"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TabFunction from "@/app/components/admins-dashboard/TabFunction";
import InstructorProfile from "@/app/components/instructors-dashboard/instructor-profile/InstructorProfile";
import { useAuth } from "@/app/hooks/useAuth";

function Page({ params }: { params: { instructorId: string } }) {
  const instructorId = params.instructorId;
  const router = useRouter();

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const { isAuthenticated } = useAuth(endpoint);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admins/login");
    }
  }, [isAuthenticated, router]);

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

  return <TabFunction tabs={tabs} />;
}

export default Page;
