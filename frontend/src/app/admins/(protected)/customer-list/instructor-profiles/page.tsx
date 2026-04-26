import InstructorsList from "@/components/customers-dashboard/instructor-profiles/InstructorsList";
import { getAllInstructorProfiles } from "@/lib/api/instructorsApi";
import {
  authenticateUserSession,
  getAuthenticatedUserId,
} from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

async function InstructorProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ instructorId?: string; customerId?: string }>;
}) {
  const { instructorId, customerId } = await searchParams;
  const userSessionType: UserType = await authenticateUserSession("admin");
  const adminId = await getAuthenticatedUserId("admin");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Fetch instructor profiles
  const instructorProfiles = await getAllInstructorProfiles(cookie);

  // Show error message when no instructor profiles are found
  if (!instructorProfiles || instructorProfiles.length === 0) {
    return <p>Error: No instructor profiles found.</p>;
  }

  // Define the breadcrumb links
  const breadcrumbLink = `/admins/customer-list/${customerId}`;

  // From this page, admins can only view instructor profiles with limited information the same as customers.
  const isCustomerView = true;

  return (
    <>
      <InstructorsList
        instructorProfiles={instructorProfiles}
        userSessionType={userSessionType}
        designatedInstructorId={
          instructorId ? parseInt(instructorId) : undefined
        }
        breadcrumbLink={breadcrumbLink}
        isCustomerView={isCustomerView}
      />
    </>
  );
}

export default InstructorProfilesPage;
