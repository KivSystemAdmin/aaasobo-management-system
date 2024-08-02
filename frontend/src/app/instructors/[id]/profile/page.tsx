"use client";

import InstructorProfile from "@/app/components/instructors-dashboard/instructor-profile/InstructorProfile";

const Page = ({ params }: { params: { id: string } }) => {
  const instructorId = params.id;

  return <InstructorProfile instructorId={instructorId} />;
};

export default Page;
