"use client";

import { useContext } from "react";
import { AuthContext } from "@/app/admins/(authenticated)/layout";
import EditRegularClass from "@/app/components/customers-dashboard/regular-classes/EditRegularClass";

function Page({ params }: { params: { customerId: string } }) {
  const customerId = params.customerId;

  // Check the authentication of the admin.
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <EditRegularClass
      customerId={customerId}
      isAdminAuthenticated={isAuthenticated}
    />
  );
}

export default Page;
