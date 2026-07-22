import InstructorPayroll from "@/components/admins-dashboard/instructors-dashboard/InstructorPayroll";
import { getAuthenticatedUserId } from "@/lib/auth/sessionUtils";

export default async function Page() {
  const instructorId = await getAuthenticatedUserId("instructor");

  return (
    <InstructorPayroll instructorId={instructorId} audience="instructor" />
  );
}
