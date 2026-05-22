import CustomerDashboardForAdmin from "@/components/admins-dashboard/customers-dashboard/classCalendarForAdmin/CustomerDashboardForAdmin";
import {
  authenticateUserSession,
  getAuthenticatedUserId,
} from "@/lib/auth/sessionUtils";

async function Page(props: { params: Promise<{ customerId: string }> }) {
  const params = await props.params;
  const userSessionType: UserType = await authenticateUserSession("admin");
  const adminId = await getAuthenticatedUserId("admin");
  const customerId = parseInt(params.customerId);
  if (isNaN(customerId)) {
    throw new Error("Invalid customerId");
  }

  return (
    <CustomerDashboardForAdmin
      adminId={adminId}
      customerId={customerId}
      userSessionType={userSessionType}
    />
  );
}

export default Page;
