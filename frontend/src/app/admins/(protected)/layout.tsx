import SideNav from "@/components/layouts/sideNav/SideNav";
import { getAuthenticatedUserId } from "@/lib/auth/sessionUtils";
import AdminLayout from "../AdminLayout";

export default async function Layout(props: { children: React.ReactNode }) {
  const adminId = await getAuthenticatedUserId("admin");

  return (
    <AdminLayout sideNav={<SideNav userId={adminId} userType="admin" />}>
      {props.children}
    </AdminLayout>
  );
}
