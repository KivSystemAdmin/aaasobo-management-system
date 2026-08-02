"use client";

import TabFunction from "@/components/admins-dashboard/TabFunction";
import EventProfile from "@/components/admins-dashboard/events-dashboard/EventProfile";
import { useTabSelect } from "@/hooks/useTabSelect";
import { getLocalizedText } from "@/lib/utils/stringUtils";
import Loading from "@/components/elements/loading/Loading";

export default function EventTabs({
  userId,
  eventId,
  event,
  userSessionType,
}: {
  userId: number;
  eventId: number;
  event: BusinessEventType | string;
  userSessionType: UserType;
}) {
  const eventName =
    typeof event !== "string" ? getLocalizedText(event.name, "ja") : "Unknown";
  const breadcrumb = [
    "イベントリスト",
    "/admins/event-list",
    `イベントページ (${eventName})`,
  ];
  const activeTabName = "activeEventTab";

  // Get the active tab from the local storage.
  const { initialActiveTab, isTabInitialized } = useTabSelect("activeEventTab");

  // Tabs with labels and content
  const tabs = [
    {
      label: "イベント",
      content: <EventProfile event={event} userSessionType={userSessionType} />,
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
