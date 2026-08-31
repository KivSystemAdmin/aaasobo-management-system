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
    "No",
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
  const itemNameLabels: Record<string, string> = {
    "Date/Time (JST)": "クラス日時（JST）",
    Day: "曜日",
    Instructor: "インストラクター",
    Children: "お子さま",
    Customer: "お客さま",
    Status: "ステータス",
    "Class Code": "クラスコード",
  }; // Set the item name labels for the table
  const userType = "admin"; // Set the user type for the registration form (It's not used in this page, but kept for consistency)
  const addButton: [boolean, string] = [true, ""]; // Enable the add button and set the button text
  const isFilterActive = searchParams.today !== "false"; // Today's classes are the default view.
  const filterHref = "/admins/class-list?today=true"; // URL to apply the filter
  const clearFilterHref = "/admins/class-list?today=false"; // URL to show the bounded all-classes view
  const columnOrder = [
    "Instructor",
    "Date/Time (JST)",
    "Day",
    "Children",
    "Customer",
    "Status",
    "Class Code",
  ];
  const data = await getAllClasses(isFilterActive, cookie); // Fetch class list data

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
        isFilterActive={isFilterActive}
        filterHref={filterHref}
        clearFilterHref={clearFilterHref}
        columnOrder={columnOrder}
      />
    </div>
  );
}
