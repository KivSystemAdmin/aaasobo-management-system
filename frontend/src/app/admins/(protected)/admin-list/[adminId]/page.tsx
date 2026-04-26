import AdminDashboardForAdmin from "@/components/admins-dashboard/AdminDashboardForAdmin";
import {
  authenticateUserSession,
  getAuthenticatedUserId,
} from "@/lib/auth/sessionUtils";

async function Page(props: { params: Promise<{ adminId: string }> }) {
  const params = await props.params;
  const userSessionType = await authenticateUserSession("admin");

  const userId = await getAuthenticatedUserId("admin");
  const adminId = parseInt(params.adminId);
  if (isNaN(adminId)) {
    throw new Error("Invalid adminId");
  }

  return (
    <AdminDashboardForAdmin
      userId={userId}
      adminId={adminId}
      userSessionType={userSessionType}
    />
  );
}

export default Page;
