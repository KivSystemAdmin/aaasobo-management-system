"use client";

import { useContext } from "react";
import { AuthContext } from "@/app/admins/(authenticated)/authContext";
import TabFunction from "@/app/components/admins-dashboard/TabFunction";
import ClassCalendar from "@/app/components/customers-dashboard/classes/ClassCalendar";
import CustomerProfile from "@/app/components/customers-dashboard/profile/CustomerProfile";
import ChildrenProfiles from "@/app/components/customers-dashboard/children-profiles/ChildrenProfiles";
import RegularClasses from "@/app/components/customers-dashboard/regular-classes/RegularClasses";
import { useTabSelect } from "@/app/hooks/useTabSelect";
import Loading from "@/app/components/Loading";

function Page({ params }: { params: { customerId: string } }) {
  const customerId = params.customerId;
  const breadcrumb = [
    "Customer List",
    `/admins/customer-list`,
    `ID: ${customerId}`,
  ];
  const activeTabName = "activeCustomerTab";

  // Check the authentication of the admin.
  const { isAuthenticated } = useContext(AuthContext);

  // Get the active tab from the local storage.
  const { initialActiveTab, isTabInitialized } =
    useTabSelect("activeCustomerTab");

  // Tabs with labels and content
  const tabs = [
    {
      label: "Class Calendar",
      content: (
        <ClassCalendar
          customerId={customerId}
          isAdminAuthenticated={isAuthenticated}
        />
      ),
    },
    {
      label: "Customer's Profile",
      content: <CustomerProfile customerId={customerId} />,
    },
    {
      label: "Children's Profile",
      content: (
        <ChildrenProfiles
          customerId={customerId}
          isAdminAuthenticated={isAuthenticated}
        />
      ),
    },
    {
      label: "Regular Classes",
      content: (
        <RegularClasses
          customerId={customerId}
          isAdminAuthenticated={isAuthenticated}
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

export default Page;
