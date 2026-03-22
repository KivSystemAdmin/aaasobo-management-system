import ListTable from "@/components/admins-dashboard/ListTable";
import { getAllClasses } from "@/lib/api/adminsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "../../../../proxy";
export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ today?: string }>;
}) {
  const params = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  // Authenticate user session
  const adminId = params.id;
  await authenticateUserSession("admin", adminId);

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Define table configuration
  const listType = "Class List";
  const omitItems = ["ID", "InstructorID", "CustomerID"]; // Omit the item from the table
  const linkItems = ["Date/Time (JST)", "Instructor", "Customer"]; // Set the item to be a link
  const replaceItems = ["ID", "InstructorID", "CustomerID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = [
    `/admins/${adminId}/class-list/[ID]`,
    `/admins/${adminId}/instructor-list/[InstructorID]`,
    `/admins/${adminId}/customer-list/[CustomerID]`,
  ]; // Set the link URL
  const userType = "admin"; // Set the user type for the registration form (It's not used in this page, but kept for consistency)
  const isAddButton = true; // Enable the add button
  const isFilterActive = searchParams.today === "true"; // Determine if the filter is active based on the search parameter
  const filterHref = `/admins/${adminId}/class-list?today=true`; // URL to apply the filter
  const clearFilterHref = `/admins/${adminId}/class-list`; // URL to clear the filter
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
