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
  const userType = "customer"; // Set the user type for the registration form (It's not used in this page, but kept for consistency)
  const isAddButton = false; // Enable the add button
  const isViewPastButton = true; // Enable the view past information button
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
        replaceItems={replaceItems}
        userType={userType}
        isAddButton={isAddButton}
        isViewPastButton={isViewPastButton}
        pastListTableProps={pastListTableProps}
      />
    </div>
  );
}
