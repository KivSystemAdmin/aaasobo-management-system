import ListTable from "@/components/admins-dashboard/ListTable";
import { getAllCustomers, getAllPastCustomers } from "@/lib/api/adminsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

export default async function Page() {
  await authenticateUserSession("admin");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Define table configuration
  const listType = "Customer List";
  const omitItems = ["ID"]; // Omit the item from the table
  const linkItems = ["Customer"]; // Set the item to be a link
  const replaceItems = ["ID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = ["/admins/customer-list/[ID]"]; // Set the link URL
  const itemNameLabels: Record<string, string> = {
    Customer: "お客さま",
    Children: "お子さま",
    Email: "メールアドレス",
    Prefecture: "出身地",
    "Start Date (JST)": "開始日（JST）",
  }; // Set the item name labels for the table
  const userType = "customer"; // Set the user type for the registration form (It's not used in this page, but kept for consistency)
  const viewPastButton: [boolean, string] = [true, "過去のお客さまリスト"]; // Enable the view past information button and set the button text
  const [currentCustomers, pastCustomers] = await Promise.all([
    getAllCustomers(cookie), // Fetch all customers data
    getAllPastCustomers(cookie), // Fetch all past customers data
  ]);
  // Define past list table configuration
  const pastListTableProps = {
    listType: "Past Customer List",
    omitItems: ["ID"],
    linkItems: ["Past Customer"],
    replaceItems: ["ID"],
    linkUrls: ["/admins/customer-list/[ID]"],
    itemNameLabels: {
      "Past Customer": "お客さま",
      "Past Children": "お子さま",
      "Start Date (JST)": "入会日（JST）",
      "End Date (JST)": "退会日（JST）",
    } as Record<string, string>,
    userType: userType as UserType,
    linkTarget: "_blank",
    width: "100vh",
  };

  return (
    <div>
      <ListTable
        listType={listType}
        fetchedData={currentCustomers}
        fetchedPastData={pastCustomers}
        omitItems={omitItems}
        linkItems={linkItems}
        linkUrls={linkUrls}
        itemNameLabels={itemNameLabels}
        replaceItems={replaceItems}
        userType={userType}
        viewPastButton={viewPastButton}
        pastListTableProps={pastListTableProps}
      />
    </div>
  );
}
