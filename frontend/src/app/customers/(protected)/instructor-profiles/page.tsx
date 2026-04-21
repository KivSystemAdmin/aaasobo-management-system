import InstructorsList from "@/components/customers-dashboard/instructor-profiles/InstructorsList";
import Breadcrumb from "@/components/elements/breadcrumb/Breadcrumb";
import { getAllInstructorProfiles } from "@/lib/api/instructorsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

async function InstructorProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ instructorId?: string }>;
}) {
  const { instructorId } = await searchParams;
  const userSessionType: UserType = await authenticateUserSession("customer");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Fetch instructor profiles
  const instructorProfiles = await getAllInstructorProfiles(cookie);

  // Show error message when no instructor profiles are found
  if (!instructorProfiles || instructorProfiles.length === 0) {
    return <p>Error: No instructor profiles found.</p>;
  }

  return (
    <>
      <Breadcrumb
        links={[
          {
            label: {
              ja: "インストラクタープロフィール",
              en: "Instructor Profiles",
            },
          },
        ]}
        className="profile"
      />
      <InstructorsList
        instructorProfiles={instructorProfiles}
        userSessionType={userSessionType}
        designatedInstructorId={
          instructorId ? parseInt(instructorId) : undefined
        }
      />
    </>
  );
}

export default InstructorProfilesPage;
