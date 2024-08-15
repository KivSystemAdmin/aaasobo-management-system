"use client";

import EditRegularClass from "@/app/components/customers-dashboard/regular-classes/EditRegularClass";
import { useAuth } from "@/app/hooks/useAuth";

function Page({ params }: { params: { customerId: string } }) {
  const customerId = params.customerId;

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  // Display a loading message while checking the authentication.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <EditRegularClass
      customerId={customerId}
      isAdminAuthenticated={isAuthenticated}
    />
  );
}

export default Page;
