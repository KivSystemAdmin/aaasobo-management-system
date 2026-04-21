import InstructorProfile from "@/components/instructors-dashboard/instructor-profile/InstructorProfile";
import { getInstructor } from "@/lib/api/instructorsApi";
import { getAuthenticatedUserId } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

async function Page() {
  const instructorId = await getAuthenticatedUserId("instructor");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Fetch instructor's data
  const data = await getInstructor(instructorId, cookie);
  let instructor = null;
  if ("message" in data) {
    instructor = data.message;
  } else {
    instructor = data.instructor;
  }

  return <InstructorProfile instructor={instructor} />;
}

export default Page;
