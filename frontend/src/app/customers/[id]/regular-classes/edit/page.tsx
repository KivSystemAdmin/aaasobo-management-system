"use client";

import EditRegularClass from "@/app/components/customers-dashboard/regular-classes/EditRegularClass";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return <EditRegularClass customerId={customerId} />;
}

export default Page;
