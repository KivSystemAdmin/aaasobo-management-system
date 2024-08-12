"use client";

import ClassDetails from "@/app/components/customers-dashboard/classes/ClassDetails";
import { useAuth } from "@/app/hooks/useAuth";

const ClassDetailPage = ({
  params,
}: {
  params: { customerId: string; classId: string };
}) => {
  const customerId = params.customerId;
  const classId = parseInt(params.classId);

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  // Display a loading message while checking the authentication.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ClassDetails
      customerId={customerId}
      classId={classId}
      isAdminAuthenticated={isAuthenticated}
    />
  );
};

export default ClassDetailPage;
