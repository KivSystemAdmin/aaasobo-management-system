"use client";

import EditChildForm from "@/app/components/customers-dashboard/children-profiles/EditChildForm";
import { getChildById } from "@/app/helper/childrenApi";
import { useEffect, useState } from "react";

function EditChildProfile({
  customerId,
  childId,
  isAdminAuthenticated,
}: {
  customerId: string;
  childId: string;
  isAdminAuthenticated?: boolean;
}) {
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
    <>
      {child ? (
        <EditChildForm
          customerId={customerId}
          child={child}
          isAdminAuthenticated={isAdminAuthenticated}
        />
      ) : (
        <div>Loading ...</div>
      )}
    </>
  );
}

export default EditChildProfile;
