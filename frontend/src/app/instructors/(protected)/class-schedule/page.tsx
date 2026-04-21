import InstructorCalendar from "@/components/instructors-dashboard/class-schedule/instructorCalendar/InstructorCalendar";
import { getAuthenticatedUserId } from "@/lib/auth/sessionUtils";

const ClassSchedulePage = async () => {
  const instructorId = await getAuthenticatedUserId("instructor");
  return <InstructorCalendar instructorId={instructorId} />;
};

export default ClassSchedulePage;
