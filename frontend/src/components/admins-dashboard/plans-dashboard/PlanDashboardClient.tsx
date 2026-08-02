"use client";

import TabFunction from "@/components/admins-dashboard/TabFunction";
import PlanProfile from "@/components/admins-dashboard/plans-dashboard/PlanProfile";
import { useTabSelect } from "@/hooks/useTabSelect";
import { getLocalizedText } from "@/lib/utils/stringUtils";
import Loading from "@/components/elements/loading/Loading";

export default function PlanTabs({
  userId,
  planId,
  plan,
  userSessionType,
}: {
  userId: number;
  planId: number;
  plan: Plan | string;
  userSessionType: UserType;
}) {
  const planName =
    typeof plan !== "string" ? getLocalizedText(plan.name, "ja") : "Unknown";
  const breadcrumb = [
    "プランリスト",
    "/admins/plan-list",
    `プランページ (${planName})`,
  ];
  const activeTabName = "activePlanTab";

  // Get the active tab from the local storage.
  const { initialActiveTab, isTabInitialized } = useTabSelect("activePlanTab");

  // Tabs with labels and content
  const tabs = [
    {
      label: "プラン",
      content: <PlanProfile plan={plan} userSessionType={userSessionType} />,
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
