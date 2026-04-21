import InstructorCalendarForAdmin from "@/components/admins-dashboard/InstructorCalendarForAdmin";
import {
  authenticateUserSession,
  getAuthenticatedUserId,
} from "@/lib/auth/sessionUtils";

const Page = async () => {
  const userSessionType: UserType = await authenticateUserSession("admin");
  const adminId = await getAuthenticatedUserId("admin");

  return (
    <InstructorCalendarForAdmin
      adminId={adminId}
      userSessionType={userSessionType}
    />
  );
};

export default Page;
