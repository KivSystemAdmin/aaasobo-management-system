"use client";

import { useAuth } from "@/app/hooks/useAuth";
import UsersTable from "@/app/components/admins-dashboard/UsersTable";

function Page() {
  const userType = "child";
  const omitItems = [""]; // Omit the item from the table
  const linkItems = ["ID", "Customer ID"]; // Set the item to be a link
  const replaceItems = ["Customer ID", "ID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = [
    "/admins/customer-list/[Customer ID]/children-profiles/[ID]/edit",
    "/admins/customer-list/[Customer ID]",
  ]; // Set the link URL

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isLoading } = useAuth(endpoint, redirectPath);

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
