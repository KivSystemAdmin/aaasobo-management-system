"use client";

import { useContext } from "react";
import { AuthContext } from "@/app/admins/(authenticated)/authContext";
import AddChildForm from "@/app/components/customers-dashboard/children-profiles/AddChildForm";

function Page({ params }: { params: { customerId: string; childId: string } }) {
  const customerId = params.customerId;

  // Check the authentication of the admin.
  const { isAuthenticated } = useContext(AuthContext);

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
