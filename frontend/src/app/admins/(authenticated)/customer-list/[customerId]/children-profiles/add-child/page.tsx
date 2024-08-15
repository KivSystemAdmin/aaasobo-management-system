"use client";

import AddChildForm from "@/app/components/customers-dashboard/children-profiles/AddChildForm";
import { useAuth } from "@/app/hooks/useAuth";

function Page({ params }: { params: { customerId: string; childId: string } }) {
  const customerId = params.customerId;

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  // Set the active tab to the children profiles tab.
  localStorage.setItem("activeCustomerTab", "2");

  // Display a loading message while checking the authentication.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div>
        <h1>Add Child</h1>
      </div>
      <AddChildForm
        customerId={customerId}
        isAdminAuthenticated={isAuthenticated}
      />
    </>
  );
}

export default Page;
