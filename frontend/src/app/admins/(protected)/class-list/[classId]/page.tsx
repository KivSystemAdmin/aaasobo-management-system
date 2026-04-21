import ClassDetails from "@/components/instructors-dashboard/class-schedule/classDetails/ClassDetails";
import {
  getSameDateClasses,
  getInstructorIdByClassId,
} from "@/lib/api/instructorsApi";
import {
  authenticateUserSession,
  getAuthenticatedUserId,
} from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

const Page = async (props: { params: Promise<{ classId: string }> }) => {
  const params = await props.params;
  const userSessionType = await authenticateUserSession("admin");
  const adminId = await getAuthenticatedUserId("admin");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Get the classId from the URL parameters
  const classId = parseInt(params.classId);
  if (isNaN(classId)) {
    return <p>Class not found (invalid class id)</p>;
  }

  // Get the instructorId from the applicable class information
  const response = await getInstructorIdByClassId(classId, cookie);

  let instructorId: number;
  if (response && "instructorId" in response) {
    instructorId = response.instructorId;
  } else {
    return <p>Class not found (invalid instructor id)</p>;
  }

  const { selectedClassDetails, sameDateClasses } = await getSameDateClasses(
    instructorId,
    classId,
    cookie,
  );

  return (
    <ClassDetails
      adminId={adminId}
      instructorId={instructorId}
      classId={classId}
      userSessionType={userSessionType}
      classDetails={selectedClassDetails}
      classes={sameDateClasses}
      previousPage="class-list"
    />
  );
};

export default Page;
