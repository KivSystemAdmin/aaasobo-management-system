import ListTable from "@/components/admins-dashboard/ListTable";
import { getAllClasses } from "@/lib/api/adminsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";
export default async function Page(props: {
  searchParams?: Promise<{ today?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  await authenticateUserSession("admin");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Define table configuration
  const listType = "Class List";
  const omitItems = [
    "ID",
    "InstructorID",
    "CustomerID",
    "Is Free Trial",
    "Canceled At",
  ]; // Omit the item from the table
  const linkItems = ["Date/Time (JST)", "Instructor", "Customer"]; // Set the item to be a link
  const replaceItems = ["ID", "InstructorID", "CustomerID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = [
    "/admins/class-list/[ID]",
    "/admins/instructor-list/[InstructorID]",
    "/admins/customer-list/[CustomerID]",
  ]; // Set the link URL
  const userType = "admin"; // Set the user type for the registration form (It's not used in this page, but kept for consistency)
  const isAddButton = true; // Enable the add button
  const isFilterActive = searchParams.today === "true"; // Determine if the filter is active based on the search parameter
  const filterHref = "/admins/class-list?today=true"; // URL to apply the filter
  const clearFilterHref = "/admins/class-list"; // URL to clear the filter
  const data = await getAllClasses(isFilterActive, cookie); // Fetch class list data

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
        isAddButton={isAddButton}
        isFilterActive={isFilterActive}
        filterHref={filterHref}
        clearFilterHref={clearFilterHref}
      />
    </div>
  );
}
