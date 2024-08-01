"use client";

import EditChildProfile from "@/app/components/customers-dashboard/children-profiles/EditChildProfile";

function Page({ params }: { params: { id: string; childId: string } }) {
  const customerId = params.id;
  const childId = params.childId;

  return (
    <>
      <div>
        <h1>Edit Child</h1>
      </div>
      <EditChildProfile customerId={customerId} childId={childId} />;
    </>
  );
}

export default Page;
