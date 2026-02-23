import DataImportDashboard from "@/components/admins-dashboard/import-dashboard/DataImportDashboard";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const adminId = params.id;
  await authenticateUserSession("admin", adminId);

  return <DataImportDashboard adminId={Number(adminId)} />;
}
