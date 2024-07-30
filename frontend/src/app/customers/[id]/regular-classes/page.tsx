"use client";

import RegularClasses from "@/app/components/customers-dashboard/regular-classes/RegularClasses";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return <RegularClasses customerId={customerId} />;
}

export default Page;
