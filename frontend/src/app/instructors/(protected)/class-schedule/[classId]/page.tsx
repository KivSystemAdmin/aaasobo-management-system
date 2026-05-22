import ClassDetails from "@/components/instructors-dashboard/class-schedule/classDetails/ClassDetails";
import { getSameDateClasses } from "@/lib/api/instructorsApi";
import { getAuthenticatedUserId } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

const ClassDetailsPage = async (props: {
  params: Promise<{ classId: string }>;
}) => {
  const params = await props.params;
  const instructorId = await getAuthenticatedUserId("instructor");
  const classId = parseInt(params.classId);
  if (isNaN(classId)) {
    throw new Error("Invalid classId");
  }

  // Get the cookies from the request headers
  const cookie = await getCookie();

  const { selectedClassDetails, sameDateClasses } = await getSameDateClasses(
    instructorId,
    classId,
    cookie,
  );

  return (
    <ClassDetails
      instructorId={instructorId}
      classId={classId}
      classDetails={selectedClassDetails}
      classes={sameDateClasses}
      previousPage="instructor-calendar"
    />
  );
};

export default ClassDetailsPage;
