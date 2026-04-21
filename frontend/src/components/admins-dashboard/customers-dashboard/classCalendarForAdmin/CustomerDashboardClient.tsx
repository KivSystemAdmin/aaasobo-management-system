"use client";

import { useMemo } from "react";
import TabFunction from "@/components/admins-dashboard/TabFunction";
import CustomerProfile from "@/components/customers-dashboard/profile/CustomerProfile";
import ChildrenProfiles from "@/components/customers-dashboard/children-profiles/ChildrenProfiles";
import RegularClasses from "@/components/customers-dashboard/regular-classes/RegularClasses";
import { useTabSelect } from "@/hooks/useTabSelect";
import Loading from "@/components/elements/loading/Loading";

function CustomerDashboardClient({
  adminId,
  customerId,
  userSessionType,
  classCalendarComponent,
  customerProfile,
  childProfiles,
}: {
  adminId: number;
  customerId: number;
  userSessionType: UserType;
  classCalendarComponent: React.ReactNode;
  customerProfile: CustomerProfile;
  childProfiles: Child[];
}) {
  const previousListPage = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem("previousListPage");
  }, []);

  const breadcrumb = useMemo(() => {
    switch (previousListPage) {
      case "class-list":
        return [
          "Class List",
          "/admins/class-list",
          `Customer Page (${customerProfile.name})`,
        ];
      case "customer-list":
        return [
          "Customer List",
          "/admins/customer-list",
          `Customer Page (${customerProfile.name})`,
        ];
      case "child-list":
        return [
          "Child List",
          "/admins/child-list",
          `Customer Page (${customerProfile.name})`,
        ];
      case "subscription-list":
        return [
          "Subscription List",
          "/admins/subscription-list",
          `Customer Page (${customerProfile.name})`,
        ];
      default:
        return [];
    }
  }, [adminId, customerProfile.name, previousListPage]);

  // Get the active tab name to set the active tab in the TabFunction component.
  const activeTabName = "activeCustomerTab";

  // Get the active tab from local storage
  const { initialActiveTab, isTabInitialized } =
    useTabSelect("activeCustomerTab");

  const tabs = [
    {
      label: "Class Calendar",
      content: classCalendarComponent,
    },
    {
      label: "Customer's Profile",
      content: (
        <CustomerProfile
          customerProfile={customerProfile}
          userSessionType={userSessionType}
        />
      ),
    },
    {
      label: "Children's Profile",
      content: (
        <ChildrenProfiles
          customerId={customerId}
          userSessionType={userSessionType}
          childProfiles={childProfiles}
          terminationAt={customerProfile.terminationAt ?? null}
        />
      ),
    },
    {
      label: "Regular Classes",
      content: (
        <RegularClasses
          adminId={adminId}
          customerId={customerId}
          userSessionType={userSessionType}
        />
      ),
    },
  ];

  if (!isTabInitialized) {
    return <Loading />;
  }

  return userSessionType === "admin" ? (
    <TabFunction
      tabs={tabs}
      breadcrumb={breadcrumb}
      activeTabName={activeTabName}
      initialActiveTab={initialActiveTab}
    />
  ) : (
    <p>Not authorized.</p>
  );
}

export default CustomerDashboardClient;
