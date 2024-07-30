"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TabFunction from "@/app/components/admins-dashboard/TabFunction";
import ChildrenProfiles from "@/app/components/customers-dashboard/children-profiles/ChildrenProfiles";
import RegularClasses from "@/app/components/customers-dashboard/regular-classes/RegularClasses";
import { useAuth } from "@/app/hooks/useAuth";

function Page({ params }: { params: { customerId: string } }) {
  const customerId = params.customerId;
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
      label: "Customer's Profile",
      content: <div>Customer's Profile(Todo)</div>,
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

  return <TabFunction tabs={tabs} />;
}

export default Page;
