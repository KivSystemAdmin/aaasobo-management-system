import ListTable from "@/components/admins-dashboard/ListTable";
import { getAllInstructors, getAllPastInstructors } from "@/lib/api/adminsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

export default async function Page() {
  await authenticateUserSession("admin");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Define table configuration
  const listType = "Instructor List";
  const omitItems = ["ID"]; // Omit the item from the table
  const linkItems = ["Instructor"]; // Set the item to be a link
  const replaceItems = ["ID"]; // Replace the item with the value(e.g., ID -> 1,2,3...)
  const linkUrls = ["/admins/instructor-list/[ID]"]; // Set the link URL
  const itemNameLabels: Record<string, string> = {
    Instructor: "インストラクター",
    English: "タイプ",
    Email: "メールアドレス",
    "Full Name": "氏名",
  }; // Set the item name labels for the table
  const userType = "instructor"; // Set the user type for the registration form
  const addButton: [boolean, string] = [true, "インストラクター"]; // Enable the add button and set the button text
  const viewPastButton: [boolean, string] = [
    true,
    "過去のインストラクター一览",
  ]; // Enable the view past information button and set the button text
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
    linkUrls: ["/admins/instructor-list/[ID]"],
    itemNameLabels: {
      "Past Instructor": "インストラクター",
      "End Date (JST)": "退会日（JST）",
    } as Record<string, string>,
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
        itemNameLabels={itemNameLabels}
        linkUrls={linkUrls}
        replaceItems={replaceItems}
        userType={userType}
        addButton={addButton}
        viewPastButton={viewPastButton}
        pastListTableProps={pastListTableProps}
      />
    </div>
  );
}
