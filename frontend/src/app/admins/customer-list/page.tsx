"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import UsersTable from "@/app/components/admins-dashboard/UsersTable";

function Page() {
  const userType = "customer";
  const omitItems = [""]; // Omit the item from the table
  const linkItems = ["ID"]; // Set the item to be a link
  const replaceItems = ["ID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = ["/admins/customer-list/[ID]"]; // Set the link URL
  const router = useRouter();

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const result = useAuth(endpoint);
  const { isAuthenticated, isLoading } = result;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admins/login");
    }
  }, [isAuthenticated, router]);

  // Display a loading message while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <UsersTable
        userType={userType}
        omitItems={omitItems}
        linkItems={linkItems}
        linkUrls={linkUrls}
        replaceItems={replaceItems}
      />
    </div>
  );
}

export default Page;
