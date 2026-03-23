import InstructorsList from "@/components/customers-dashboard/instructor-profiles/InstructorsList";
import { getAllInstructorProfiles } from "@/lib/api/instructorsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "../../../../../proxy";

async function InstructorProfilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ instructorId?: string; customerId?: string }>;
}) {
  const { id: adminId } = await params;
  const { instructorId, customerId } = await searchParams;
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

  // Define the breadcrumb links
  const breadcrumbLink = `/admins/${adminId}/customer-list/${customerId}`;

  return (
    <>
      <InstructorsList
        instructorProfiles={instructorProfiles}
        userSessionType={userSessionType}
        designatedInstructorId={
          instructorId ? parseInt(instructorId) : undefined
        }
        breadcrumbLink={breadcrumbLink}
      />
    </>
  );
}

export default InstructorProfilesPage;
