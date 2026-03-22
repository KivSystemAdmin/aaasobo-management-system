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
  const isTodayFilterActive = searchParams.today === "true";
  const data = await getAllClasses(isTodayFilterActive, cookie); // Fetch class list data

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
        showTodayFilterButton={true}
        isTodayFilterActive={isTodayFilterActive}
        todayFilterHref={`/admins/${adminId}/class-list?today=true`}
        clearTodayFilterHref={`/admins/${adminId}/class-list`}
      />
    </div>
  );
}
