import ListTable from "@/components/admins-dashboard/ListTable";
import { getAllInstructors, getAllPastInstructors } from "@/lib/api/adminsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "../../../../proxy";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // Authenticate user session
  const adminId = params.id;
  await authenticateUserSession("admin", adminId);

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Define table configuration
  const listType = "Instructor List";
  const omitItems = ["ID"]; // Omit the item from the table
  const linkItems = ["Instructor"]; // Set the item to be a link
  const replaceItems = ["ID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = [`/admins/${adminId}/instructor-list/[ID]`]; // Set the link URL
  const userType = "instructor"; // Set the user type for the registration form
  const isAddButton = true; // Enable the add button
  const isViewPastButton = true; // Enable the view past information button
  const [currentInstructors, pastInstructors] = await Promise.all([
    getAllInstructors(cookie), // Fetch all instructors data
    getAllPastInstructors(cookie), // Fetch all past instructors data
  ]);
  // Define past list table configuration
  const pastListTableProps = {
    listType: "Past Instructor List",
    omitItems: ["ID"],
    linkItems: ["Past Instructor"],
    replaceItems: ["ID"],
    linkUrls: [`/admins/${adminId}/instructor-list/[ID]`],
    userType: userType as UserType,
    linkTarget: "_blank",
    width: "70vh",
  };

  return (
    <div>
      <ListTable
        listType={listType}
        fetchedData={currentInstructors}
        fetchedPastData={pastInstructors}
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
