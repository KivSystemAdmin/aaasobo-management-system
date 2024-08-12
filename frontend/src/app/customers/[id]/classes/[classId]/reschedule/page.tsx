"use client";

import RescheduleClass from "@/app/components/customers-dashboard/classes/RescheduleClass";

function Page({ params }: { params: { id: string; classId: string } }) {
  const customerId = params.id;
  const classId = params.classId;

  return <RescheduleClass customerId={customerId} classId={classId} />;
}

export default Page;
