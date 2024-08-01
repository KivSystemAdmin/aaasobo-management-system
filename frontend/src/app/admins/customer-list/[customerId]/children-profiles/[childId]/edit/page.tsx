"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import EditChildProfile from "@/app/components/customers-dashboard/children-profiles/EditChildProfile";
import { useAuth } from "@/app/hooks/useAuth";

function Page({ params }: { params: { customerId: string; childId: string } }) {
  const customerId = params.customerId;
  const childId = params.childId;
  const router = useRouter();

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const { isAuthenticated } = useAuth(endpoint);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admins/login");
    }
  }, [isAuthenticated, router]);

  return (
    <>
      <div>
        <h1>Edit Child</h1>
      </div>
      <EditChildProfile
        customerId={customerId}
        childId={childId}
        isAdminAuthenticated={isAuthenticated}
      />
    </>
  );
}

export default Page;
