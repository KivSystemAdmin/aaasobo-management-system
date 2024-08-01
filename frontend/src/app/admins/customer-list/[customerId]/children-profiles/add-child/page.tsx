"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AddChildForm from "@/app/components/customers-dashboard/children-profiles/AddChildForm";
import { useAuth } from "@/app/hooks/useAuth";

function Page({ params }: { params: { customerId: string; childId: string } }) {
  const customerId = params.customerId;
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
        <h1>Add Child</h1>
      </div>
      <AddChildForm
        customerId={customerId}
        isAdminAuthenticated={isAuthenticated}
      />
    </>
  );
}

export default Page;
