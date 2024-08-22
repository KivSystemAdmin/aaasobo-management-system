"use client";

import { useContext, useEffect } from "react";
import { AuthContext } from "@/app/admins/(authenticated)/authContext";
import ClassDetails from "@/app/components/instructors-dashboard/class-schedule/ClassDetails";

const Page = ({
  params,
}: {
  params: { instructorId: string; classId: string };
}) => {
  const instructorId = parseInt(params.instructorId);
  const classId = parseInt(params.classId);

  // Check the authentication of the admin.
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <ClassDetails
      instructorId={instructorId}
      classId={classId}
      isAdminAuthenticated={isAuthenticated}
    />
  );
};

export default Page;
