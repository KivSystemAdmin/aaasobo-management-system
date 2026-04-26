import InstructorDashboardForAdmin from "@/components/admins-dashboard/instructors-dashboard/InstructorDashboardForAdmin";
import {
  authenticateUserSession,
  getAuthenticatedUserId,
} from "@/lib/auth/sessionUtils";

async function Page(props: { params: Promise<{ instructorId: string }> }) {
  const params = await props.params;
  const userSessionType: UserType = await authenticateUserSession("admin");
  const adminId = await getAuthenticatedUserId("admin");
  const instructorId = parseInt(params.instructorId);
  if (isNaN(instructorId)) {
    throw new Error("Invalid instructorId");
  }

  return (
    <InstructorDashboardForAdmin
      adminId={adminId}
      instructorId={instructorId}
      userSessionType={userSessionType}
    />
  );
}

export default Page;
