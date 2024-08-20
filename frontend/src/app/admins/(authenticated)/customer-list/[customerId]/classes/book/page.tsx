"use client";

import { useContext } from "react";
import { AuthContext } from "@/app/admins/(authenticated)/layout";
import BookClass from "@/app/components/customers-dashboard/classes/BookClass";

function Page({ params }: { params: { customerId: string } }) {
  const customerId = params.customerId;

  // Check the authentication of the admin.
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <BookClass customerId={customerId} isAdminAuthenticated={isAuthenticated} />
  );
}

export default Page;
