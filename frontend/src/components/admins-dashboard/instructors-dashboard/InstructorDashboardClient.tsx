"use client";

import { useMemo } from "react";

import TabFunction from "@/components/admins-dashboard/TabFunction";
import InstructorProfile from "@/components/instructors-dashboard/instructor-profile/InstructorProfile";
import { useTabSelect } from "@/hooks/useTabSelect";
import InstructorSchedule from "./instructor-schedule/InstructorSchedule";
import AvailabilityCalendar from "./instructor-schedule/AvailabilityCalendar";
import Loading from "@/components/elements/loading/Loading";
import InstructorPayroll from "./InstructorPayroll";
import InstructorTagsTab from "./InstructorTags";
import type {
  InstructorSchedule as InstructorScheduleType,
  InstructorTagsResponse,
  TagCatalogResponse,
} from "@shared/schemas/instructors";
import type { InstructorScheduleWithSlots } from "@/lib/api/instructorsApi";

export default function InstructorTabs({
  adminId,
  instructorId,
  instructor,
  token,
  userSessionType,
  initialSchedules,
  initialSelectedScheduleId,
  initialSelectedSchedule,
  initialInstructorTags,
  initialTagCatalog,
  classScheduleComponent,
}: {
  adminId: number;
  instructorId: number;
  instructor: Instructor | string;
  token: string;
  userSessionType: UserType;
  initialSchedules: InstructorScheduleType[];
  initialSelectedScheduleId: number | null;
  initialSelectedSchedule: InstructorScheduleWithSlots | null;
  initialInstructorTags: InstructorTagsResponse | null;
  initialTagCatalog: TagCatalogResponse["tags"];
  classScheduleComponent: React.ReactNode;
}) {
  const nickname = typeof instructor !== "string" ? instructor.nickname : null;
  const previousListPage = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem("previousListPage");
  }, []);

  const breadcrumb = useMemo(() => {
    switch (previousListPage) {
      case "instructor-list":
        return [
          "Instructor List",
          "/admins/instructor-list",
          `Instructor Page (${nickname || "Unknown"})`,
        ];
      case "class-list":
        return [
          "Class List",
          "/admins/class-list",
          `Instructor Page (${nickname || "Unknown"})`,
        ];
      default:
        return [];
    }
  }, [nickname, previousListPage]);
  const activeTabName = "activeInstructorTab";

  // Get the active tab from the local storage.
  const { initialActiveTab, isTabInitialized } = useTabSelect(
    "activeInstructorTab",
  );

  // Tabs with labels and content
  const tabs = [
    {
      label: "Class Schedule",
      content: classScheduleComponent,
    },
    {
      label: "Profile",
      content: (
        <InstructorProfile
          instructor={instructor}
          token={token}
          userSessionType={userSessionType}
        />
      ),
    },
    {
      label: "Availability",
      content: <AvailabilityCalendar instructorId={instructorId} />,
    },
    {
      label: "Schedule",
      content: (
        <InstructorSchedule
          instructorId={instructorId}
          initialSchedules={initialSchedules}
          initialSelectedScheduleId={initialSelectedScheduleId}
          initialSelectedSchedule={initialSelectedSchedule}
        />
      ),
    },
    {
      label: "Payroll",
      content: <InstructorPayroll instructorId={instructorId} />,
    },
    {
      label: "Tags",
      content: (
        <InstructorTagsTab
          instructorId={instructorId}
          initialInstructorTags={initialInstructorTags}
          initialTagCatalog={initialTagCatalog}
        />
      ),
    },
  ];

  // Display a loading message while initializing the tab.
  if (!isTabInitialized) {
    return <Loading />;
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
