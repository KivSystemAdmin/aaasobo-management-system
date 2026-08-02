"use client";

import { useMemo } from "react";

import TabFunction from "@/components/admins-dashboard/TabFunction";
import InstructorProfile from "@/components/instructors-dashboard/instructor-profile/InstructorProfile";
import { useTabSelect } from "@/hooks/useTabSelect";
import InstructorSchedule from "./instructor-schedule/InstructorSchedule";
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
          "インストラクターリスト",
          "/admins/instructor-list",
          `インストラクターページ (${nickname || "Unknown"})`,
        ];
      case "class-list":
        return [
          "クラスリスト",
          "/admins/class-list",
          `インストラクターページ (${nickname || "Unknown"})`,
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
      label: "クラスカレンダー",
      content: classScheduleComponent,
    },
    {
      label: "プロフィール",
      content: (
        <InstructorProfile
          instructor={instructor}
          token={token}
          userSessionType={userSessionType}
        />
      ),
    },
    {
      label: "スケジュール",
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
      label: "給与管理",
      content: <InstructorPayroll instructorId={instructorId} />,
    },
    {
      label: "タグ設定",
      content: (
        <InstructorTagsTab
          instructorId={instructorId}
          instructorNickName={nickname || ""}
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
