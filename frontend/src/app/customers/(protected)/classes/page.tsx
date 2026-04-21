import ClassCalendar from "@/components/customers-dashboard/classes/ClassCalendar";
import {
  authenticateUserSession,
  getAuthenticatedUserId,
} from "@/lib/auth/sessionUtils";

const ClassesPage = async () => {
  const userSessionType: UserType = await authenticateUserSession("customer");
  const customerId = await getAuthenticatedUserId("customer");

  return (
    <ClassCalendar customerId={customerId} userSessionType={userSessionType} />
  );
};

export default ClassesPage;
