import SideNav from "@/components/layouts/sideNav/SideNav";
import { getAuthenticatedUserId } from "@/lib/auth/sessionUtils";
import CustomerLayout from "../CustomerLayout";

export default async function Layout(props: { children: React.ReactNode }) {
  const customerId = await getAuthenticatedUserId("customer");

  return (
    <CustomerLayout
      sideNav={<SideNav userId={customerId} userType="customer" />}
    >
      {props.children}
    </CustomerLayout>
  );
}
