"use client";

import TabFunction from "@/components/admins-dashboard/TabFunction";
import AdminProfile from "@/components/admins-dashboard/AdminProfile";
import { useTabSelect } from "@/hooks/useTabSelect";
import Loading from "@/components/elements/loading/Loading";
import { MASKED_HEAD_LETTERS } from "@/lib/data/data";

export default function AdminTabs({
  userId,
  admin,
  userSessionType,
}: {
  userId: number;
  adminId: number;
  admin: Admin | string;
  userSessionType: UserType;
}) {
  const adminName =
    typeof admin !== "string"
      ? MASKED_HEAD_LETTERS.includes(admin.name)
        ? "Unknown"
        : admin.name
      : "Unknown";
  const breadcrumb = [
    "Admin List",
    `/admins/${userId}/admin-list`,
    `Admin Page (${adminName})`,
  ];
  const activeTabName = "activeAdminTab";

  // Get the active tab from the local storage.
  const { initialActiveTab, isTabInitialized } = useTabSelect("activeAdminTab");

  // Tabs with labels and content
  const tabs = [
    {
      label: "Admin's Profile",
      content: (
        <AdminProfile
          userId={userId}
          admin={admin}
          userSessionType={userSessionType}
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
