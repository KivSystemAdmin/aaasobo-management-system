import ListTable from "@/components/admins-dashboard/ListTable";
import { getAllPlans } from "@/lib/api/adminsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

export default async function Page() {
  await authenticateUserSession("admin");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Define table configuration
  const listType = "Plan List";
  const omitItems = ["ID"]; // Omit the item from the table
  const linkItems = ["Plan (Japanese)"]; // Set the item to be a link
  const replaceItems = ["ID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = ["/admins/plan-list/[ID]"]; // Set the link URL
  const itemNameLabels: Record<string, string> = {
    "Plan (Japanese)": "プラン",
    "Plan (English)": "プラン（英語）",
    English: "インストラクタータイプ",
    "Weekly Class Times": "週のクラス回数",
    Description: "説明",
  }; // Set the item name labels for the table
  const userType = "admin"; // Set the user type for the registration form
  const categoryType = "plan"; // Set the category type for the registration form
  const addButton: [boolean, string] = [true, "プラン"]; // Enable the add button and set the button text
  const data = await getAllPlans(cookie); // Fetch all plans data

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
        categoryType={categoryType}
        addButton={addButton}
      />
    </div>
  );
}
