"use client";

import EditChildProfile from "@/app/components/customers-dashboard/children-profiles/EditChildProfile";
import { useAuth } from "@/app/hooks/useAuth";

function Page({ params }: { params: { customerId: string; childId: string } }) {
  const customerId = params.customerId;
  const childId = params.childId;

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  // Display a loading message while checking the authentication.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div>
        <h1>Edit Child</h1>
      </div>
      <EditChildProfile
        customerId={customerId}
        childId={childId}
        isAdminAuthenticated={isAuthenticated}
      />
    </>
  );
}

export default Page;
