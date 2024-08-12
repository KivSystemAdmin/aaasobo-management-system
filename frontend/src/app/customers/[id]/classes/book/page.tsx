"use client";

import BookClass from "@/app/components/customers-dashboard/classes/BookClass";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return <BookClass customerId={customerId} />;
}

export default Page;
