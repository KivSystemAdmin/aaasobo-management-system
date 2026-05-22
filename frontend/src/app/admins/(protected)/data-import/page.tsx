import DataImportDashboard from "@/components/admins-dashboard/import-dashboard/DataImportDashboard";
import {
  authenticateUserSession,
  getAuthenticatedUserId,
} from "@/lib/auth/sessionUtils";

export default async function Page() {
  await authenticateUserSession("admin");
  const adminId = await getAuthenticatedUserId("admin");

  return <DataImportDashboard adminId={adminId} />;
}
