"use client";

import BookClass from "@/app/components/customers-dashboard/classes/BookClass";
import { useAuth } from "@/app/hooks/useAuth";

function Page({ params }: { params: { customerId: string } }) {
  const customerId = params.customerId;

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
    <BookClass customerId={customerId} isAdminAuthenticated={isAuthenticated} />
  );
}

export default Page;
