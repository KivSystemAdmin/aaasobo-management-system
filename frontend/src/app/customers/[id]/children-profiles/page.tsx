"use client";

import ChildrenProfiles from "@/app/components/customers-dashboard/children-profiles/ChildrenProfiles";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return <ChildrenProfiles customerId={customerId} />;
}

export default Page;
