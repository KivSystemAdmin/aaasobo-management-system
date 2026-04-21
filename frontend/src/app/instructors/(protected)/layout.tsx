import SideNav from "@/components/layouts/sideNav/SideNav";
import { getAuthenticatedUserId } from "@/lib/auth/sessionUtils";
import InstructorLayout from "../InstructorLayout";

export default async function Layout(props: { children: React.ReactNode }) {
  const instructorId = await getAuthenticatedUserId("instructor");

  return (
    <InstructorLayout
      sideNav={<SideNav userId={instructorId} userType="instructor" />}
    >
      {props.children}
    </InstructorLayout>
  );
}
