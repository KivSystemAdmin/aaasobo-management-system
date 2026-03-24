import InstructorsList from "@/components/customers-dashboard/instructor-profiles/InstructorsList";
import { getAllInstructorProfiles } from "@/lib/api/instructorsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "../../../../proxy";

async function InstructorProfilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: adminId } = await params;
  // Authenticate user session
  const userSessionType: UserType = await authenticateUserSession(
    "admin",
    adminId,
  );

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Fetch instructor profiles
  const instructorProfiles = await getAllInstructorProfiles(cookie);

  // Show error message when no instructor profiles are found
  if (!instructorProfiles || instructorProfiles.length === 0) {
    return <p>Error: No instructor profiles found.</p>;
  }

  // From this page, admins can only view instructor profiles with limited information the same as customers.
  const isCustomerView = true;

  return (
    <>
      <InstructorsList
        instructorProfiles={instructorProfiles}
        userSessionType={userSessionType}
        isCustomerView={isCustomerView}
      />
    </>
  );
}

export default InstructorProfilesPage;
