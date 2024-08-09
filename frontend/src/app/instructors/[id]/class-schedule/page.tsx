"use client";

import InstructorCalendar from "@/app/components/instructors-dashboard/class-schedule/InstructorCalendar";

const Page = ({ params }: { params: { id: string } }) => {
  let instructorId = null;
  if (params.id) {
    instructorId = parseInt(params.id);
  }

  return <InstructorCalendar id={instructorId} />;
};

export default Page;
