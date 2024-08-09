"use client";

import EditRegularClass from "@/app/components/customers-dashboard/regular-classes/EditRegularClass";
import InstructorsSchedule from "@/app/components/customers-dashboard/regular-classes/InstructorsSchedule";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;
  return (
    <div>
      <EditRegularClass customerId={customerId} />
      <InstructorsSchedule />
    </div>
  );
}

export default Page;
