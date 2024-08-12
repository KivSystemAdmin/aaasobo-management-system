"use client";

import ClassCalendar from "@/app/components/customers-dashboard/classes/ClassCalendar";

const Page = ({ params }: { params: { id: string } }) => {
  const customerId = params.id;
  return <ClassCalendar customerId={customerId} />;
};

export default Page;
