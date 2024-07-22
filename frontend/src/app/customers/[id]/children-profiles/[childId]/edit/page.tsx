"use client";

import EditChildForm from "@/app/components/customers-dashboard/children-profiles/EditChildForm";
import { getChildById } from "@/app/helper/childrenApi";
import { useEffect, useState } from "react";

function Page({ params }: { params: { id: string; childId: string } }) {
  const customerId = params.id;
  const childId = params.childId;

  const [child, setChild] = useState<Child | null>(null);

  useEffect(() => {
    const fetchChildById = async (id: string) => {
      try {
        const child = await getChildById(id);
        setChild(child);
      } catch (error) {
        console.error("Failed to fetch child:", error);
      }
    };
    fetchChildById(childId);
  }, [childId]);

  return (
    <div>
      <div>
        <h1>Edit Child</h1>
      </div>
      {child ? (
        <EditChildForm customerId={customerId} child={child} />
      ) : (
        <div>Loading ...</div>
      )}
    </div>
  );
}

export default Page;
