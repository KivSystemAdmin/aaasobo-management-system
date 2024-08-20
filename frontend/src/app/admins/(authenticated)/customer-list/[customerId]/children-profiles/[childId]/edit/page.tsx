"use client";

import { useContext } from "react";
import { AuthContext } from "@/app/admins/(authenticated)/layout";
import EditChildProfile from "@/app/components/customers-dashboard/children-profiles/EditChildProfile";

function Page({ params }: { params: { customerId: string; childId: string } }) {
  const customerId = params.customerId;
  const childId = params.childId;

  // Check the authentication of the admin.
  const { isAuthenticated } = useContext(AuthContext);

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
