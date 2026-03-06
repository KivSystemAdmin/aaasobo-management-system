import SideNav from "@/components/layouts/sideNav/SideNav";
import { getUserSession } from "@/lib/auth/sessionUtils";
import AdminLayout from "./AdminLayout";

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  // Get the admin id from the URL parameters
  let adminId = parseInt(params.id);
  if (isNaN(adminId)) {
    // Get admin id from session
    const session = await getUserSession("admin");

    // If session is not found or user id is not present, throw an error
    if (!session || !session.user.id) {
      throw new Error("Invalid adminId");
    }
    adminId = parseInt(session.user.id);
  }

  return (
    <AdminLayout sideNav={<SideNav userId={adminId} userType="admin" />}>
      {props.children}
    </AdminLayout>
  );
}
