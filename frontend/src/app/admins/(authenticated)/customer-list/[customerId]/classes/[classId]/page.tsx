"use client";

import { useContext } from "react";
import { AuthContext } from "@/app/admins/(authenticated)/layout";
import ClassDetails from "@/app/components/customers-dashboard/classes/ClassDetails";

const ClassDetailPage = ({
  params,
}: {
  params: { customerId: string; classId: string };
}) => {
  const customerId = params.customerId;
  const classId = parseInt(params.classId);

  // Check the authentication of the admin.
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <ClassDetails
      customerId={customerId}
      classId={classId}
      isAdminAuthenticated={isAuthenticated}
    />
  );
};

export default ClassDetailPage;
