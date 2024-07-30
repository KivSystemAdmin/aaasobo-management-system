"use client";

import TabFunction from "@/app/components/admins-dashboard/TabFunction";
import ChildrenProfiles from "@/app/components/customers-dashboard/children-profiles/ChildrenProfiles";
import RegularClasses from "@/app/components/customers-dashboard/regular-classes/RegularClasses";

function Page({ params }: { params: { customerId: string } }) {
  const customerId = params.customerId;

  // Tabs with labels and content
  const tabs = [
    {
      label: "Customer's Profile",
      content: <div>Customer's Profile(Todo)</div>,
    },
    {
      label: "Children's Profile",
      content: <ChildrenProfiles customerId={customerId} />,
    },
    {
      label: "Regular Classes",
      content: <RegularClasses customerId={customerId} />,
    },
  ];

  return <TabFunction tabs={tabs} />;
}

export default Page;
