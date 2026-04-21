import PlanDashboardForAdmin from "@/components/admins-dashboard/plans-dashboard/PlanDashboardForAdmin";
import {
  authenticateUserSession,
  getAuthenticatedUserId,
} from "@/lib/auth/sessionUtils";

async function Page(props: { params: Promise<{ planId: string }> }) {
  const params = await props.params;
  const userSessionType: UserType = await authenticateUserSession("admin");
  const userId = await getAuthenticatedUserId("admin");
  const planId = parseInt(params.planId);
  if (isNaN(planId)) {
    throw new Error("Invalid planId");
  }

  return (
    <PlanDashboardForAdmin
      userId={userId}
      planId={planId}
      userSessionType={userSessionType}
    />
  );
}

export default Page;
