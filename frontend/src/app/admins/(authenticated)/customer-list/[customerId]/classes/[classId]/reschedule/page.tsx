"use client";

import { useContext } from "react";
import { AuthContext } from "@/app/admins/(authenticated)/authContext";
import RescheduleClass from "@/app/components/customers-dashboard/classes/RescheduleClass";

function Page({ params }: { params: { customerId: string; classId: string } }) {
  const customerId = params.customerId;
  const classId = params.classId;

  // Check the authentication of the admin.
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <RescheduleClass
      customerId={customerId}
      classId={classId}
      isAdminAuthenticated={isAuthenticated}
    />
  );
}

export default Page;
