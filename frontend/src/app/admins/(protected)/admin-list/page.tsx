import ListTable from "@/components/admins-dashboard/ListTable";
import { getAllAdmins } from "@/lib/api/adminsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

export default async function Page() {
  await authenticateUserSession("admin");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Define table configuration
  const listType = "Admin List";
  const omitItems = ["ID"]; // Omit the item from the table
  const linkItems = ["Admin"]; // Set the item to be a link
  const replaceItems = ["ID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = ["/admins/admin-list/[ID]"]; // Set the link URL
  const itemNameLabels: Record<string, string> = {
    Admin: "管理者",
    Email: "メールアドレス",
  }; // Set the item name labels for the table
  const userType = "admin"; // Set the user type for the registration form
  const addButton: [boolean, string] = [true, "管理者"]; // Enable the add button and set the button text
  const data = await getAllAdmins(cookie); // Fetch all admins data

  return (
    <div>
      <ListTable
        listType={listType}
        fetchedData={data}
        omitItems={omitItems}
        linkItems={linkItems}
        linkUrls={linkUrls}
        itemNameLabels={itemNameLabels}
        replaceItems={replaceItems}
        userType={userType}
        addButton={addButton}
      />
    </div>
  );
}
