import EnrollmentStatusList from "@/components/admins-dashboard/enrollment-status/EnrollmentStatusList";
import { getEnrollmentStatus } from "@/lib/api/adminsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

export default async function Page() {
  await authenticateUserSession("admin");
  const data = await getEnrollmentStatus(await getCookie());
  return <EnrollmentStatusList customers={data} />;
}
