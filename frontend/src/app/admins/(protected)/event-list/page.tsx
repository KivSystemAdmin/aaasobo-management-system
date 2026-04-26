import ListTable from "@/components/admins-dashboard/ListTable";
import { getAllEvents } from "@/lib/api/adminsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

export default async function Page() {
  await authenticateUserSession("admin");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Define table configuration
  const listType = "Event List";
  const omitItems = ["ID", "Event"]; // Omit the item from the table
  const linkItems = ["Event (Japanese)"]; // Set the item to be a link
  const replaceItems = ["ID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = ["/admins/event-list/[ID]"]; // Set the link URL
  const userType = "admin"; // Set the user type for the registration form
  const categoryType = "event"; // Set the category type for the registration form
  const isAddButton = true; // Enable the add button
  const data = await getAllEvents(cookie); // Fetch all events data

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
