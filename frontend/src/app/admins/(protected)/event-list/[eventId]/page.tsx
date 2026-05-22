import EventDashboardForAdmin from "@/components/admins-dashboard/events-dashboard/EventDashboardForAdmin";
import {
  authenticateUserSession,
  getAuthenticatedUserId,
} from "@/lib/auth/sessionUtils";

async function Page(props: { params: Promise<{ eventId: string }> }) {
  const params = await props.params;
  const userSessionType: UserType = await authenticateUserSession("admin");
  const userId = await getAuthenticatedUserId("admin");
  const eventId = parseInt(params.eventId);
  if (isNaN(eventId)) {
    throw new Error("Invalid eventId");
  }

  return (
    <EventDashboardForAdmin
      userId={userId}
      eventId={eventId}
      userSessionType={userSessionType}
    />
  );
}

export default Page;
