"use client";

import UsersTable from "@/app/components/admins-dashboard/UsersTable";

export default function Page() {
  const userType = "Instructor List";
  const omitItems = [""]; // Omit the item from the table
  const linkItems = ["ID"]; // Set the item to be a link
  const replaceItems = ["ID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = ["/admins/instructor-list/[ID]"]; // Set the link URL
  const addUserLink = ["/admins/instructor-list/register", "Add instructor"]; // Set the link URL and name to add a user

  return (
    <div>
      <UsersTable
        userType={userType}
        omitItems={omitItems}
        linkItems={linkItems}
        linkUrls={linkUrls}
        replaceItems={replaceItems}
        addUserLink={addUserLink}
      />
    </div>
  );
}
