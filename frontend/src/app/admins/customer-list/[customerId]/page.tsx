"use client";

import TabFunction from "@/app/components/admins-dashboard/TabFunction";
import ClassCalendar from "@/app/components/customers-dashboard/classes/ClassCalendar";
import CustomerProfile from "@/app/components/customers-dashboard/profile/CustomerProfile";
import ChildrenProfiles from "@/app/components/customers-dashboard/children-profiles/ChildrenProfiles";
import RegularClasses from "@/app/components/customers-dashboard/regular-classes/RegularClasses";
import { useAuth } from "@/app/hooks/useAuth";
import { useTabSelect } from "@/app/hooks/useTabSelect";

function Page({ params }: { params: { customerId: string } }) {
  const customerId = params.customerId;
  const breadcrumb = ["Customer List", `ID: ${customerId}`];

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

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

  // Display a loading message while checking the authentication and initializing the tab.
  if (isLoading || !isTabInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <TabFunction
      tabs={tabs}
      breadcrumb={breadcrumb}
      initialActiveTab={initialActiveTab}
    />
  );
}

export default Page;
