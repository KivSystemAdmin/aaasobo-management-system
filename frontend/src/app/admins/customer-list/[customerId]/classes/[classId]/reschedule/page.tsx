"use client";

import { useAuth } from "@/app/hooks/useAuth";
import RescheduleClass from "@/app/components/customers-dashboard/classes/RescheduleClass";

function Page({ params }: { params: { customerId: string; classId: string } }) {
  const customerId = params.customerId;
  const classId = params.classId;

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  // Set the active tab to the class calendar tab.
  localStorage.setItem("activeCustomerTab", "0");

  // Display a loading message while checking the authentication.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <RescheduleClass
      customerId={customerId}
      classId={classId}
      isAdminAuthenticated={isAuthenticated}
    />
  );
}

export default Page;
