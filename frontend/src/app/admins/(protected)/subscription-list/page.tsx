import ListTable from "@/components/admins-dashboard/ListTable";
import { getAllSubscriptions } from "@/lib/api/adminsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

export default async function Page() {
  await authenticateUserSession("admin");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Define table configuration
  const listType = "Subscription List";
  const omitItems = [""]; // Omit the item from the table
  const linkItems = ["ID"]; // Set the item to be a link
  const replaceItems = ["ID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = ["/admins/customer-list/[ID]"]; // Set the link URL
  const userType = "admin"; // Set the user type for the registration form
  const categoryType = "subscription"; // Set the category type for the registration form
  const isAddButton = false; // Enable the add button
  const data = await getAllSubscriptions(cookie); // Fetch all subscriptions data

  return (
    <div>
      <ListTable
        listType={listType}
        fetchedData={data}
        omitItems={omitItems}
        linkItems={linkItems}
        linkUrls={linkUrls}
        replaceItems={replaceItems}
        userType={userType}
        categoryType={categoryType}
        isAddButton={isAddButton}
      />
    </div>
  );
}
