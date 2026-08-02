import ListTable from "@/components/admins-dashboard/ListTable";
import { getAllChildren } from "@/lib/api/adminsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

export default async function Page() {
  await authenticateUserSession("admin");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Define table configuration
  const listType = "Child List";
  const omitItems = [""]; // Omit the item from the table
  const linkItems = ["ID"]; // Set the item to be a link
  const replaceItems = ["Customer ID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = ["/admins/customer-list/[Customer ID]"]; // Set the link URL
  const itemNameLabels: Record<string, string> = {
    Customer: "お客さま",
    Children: "お子さま",
  };
  const userType = "admin"; // Set the user type for the registration form (It's not used in this page, but kept for consistency)
  const data = await getAllChildren(cookie); // Fetch all children data

  return (
    <div>
      <ListTable
        listType={listType}
        fetchedData={data}
        omitItems={omitItems}
        linkItems={linkItems}
        linkUrls={linkUrls}
        replaceItems={replaceItems}
        itemNameLabels={itemNameLabels}
        userType={userType}
      />
    </div>
  );
}
