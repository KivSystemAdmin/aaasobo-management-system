import { useEffect, useState } from "react";
import { getClassesByInstructorId } from "@/app/helper/classesApi";
import { formatDate } from "@/app/helper/dateUtils";
import InstructorClassDetail from "@/app/components/instructors-dashboard/class-schedule/InstructorClassDetail";
import InstructorClassesTable from "@/app/components/instructors-dashboard/class-schedule/InstructorClassesTable";
import styles from "./ClassDetails.module.scss";
import Link from "next/link";

type StatusType =
  | "booked"
  | "completed"
  | "canceledByCustomer"
  | "canceledByInstructor";

function ClassDetails({
  instructorId,
  classId,
  isAdminAuthenticated,
}: {
  instructorId: number | null;
  classId: number | null;
  isAdminAuthenticated?: boolean;
}) {
  const [classDetail, setClassDetail] = useState<InstructorClassDetail | null>(
    null,
  );
  const [selectedDateClasses, setSelectedDateClasses] = useState<
    InstructorClassDetail[]
  >([]);
  const [classDate, setClassDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClassDetail = async () => {
    if (!instructorId || !classId) return;

    try {
      const classes: InstructorClassDetail[] =
        await getClassesByInstructorId(instructorId);

      const classDetail = classes.find((eachClass) => eachClass.id === classId);
      setClassDetail(classDetail || null);

      const selectedClassDate = classDetail?.dateTime
        ? formatDate(new Date(classDetail.dateTime), "Asia/Manila")
        : "";
      setClassDate(selectedClassDate);

      const classesOnSelectedDate = classes.filter(
        (eachClass) =>
          formatDate(new Date(eachClass.dateTime), "Asia/Manila") ===
          selectedClassDate,
      );
      setSelectedDateClasses(classesOnSelectedDate);
    } catch (error) {
      console.error("Failed to fetch class detail:", error);
      setError("Failed to load class details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassDetail();
  }, [instructorId, classId]);

  const handleUpdateClassDetail = (
    completedClassId: number,
    attendedChildren: Child[],
    updatedStatus: StatusType,
  ) => {
    if (completedClassId !== classId) return;

    setClassDetail((prev) => {
      if (prev === null) return prev;

      return {
        ...prev,
        attendingChildren: attendedChildren,
        status: updatedStatus,
      };
    });
  };

  if (loading) return <div className={styles.loadingContainer}>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className={styles.classDetails}>
      <nav className={styles.breadcrumb}>
        <ul className={styles.breadcrumb__list}>
          <li className={styles.breadcrumb__item}>
            <Link href={`/instructors/${instructorId}/class-schedule`} passHref>
              Class Schedule
            </Link>
          </li>
          <li className={styles.breadcrumb__separator}>{" >> "}</li>
          <li className={styles.breadcrumb__item}>Class Details</li>
        </ul>
      </nav>

      <div className={styles.classDetails__container}>
        <div className={styles.classDetails__classesList}>
          {instructorId !== null && classId !== null ? (
            <InstructorClassesTable
              instructorId={instructorId}
              selectedDateClasses={selectedDateClasses}
              timeZone="Asia/Manila"
              handleUpdateClassDetail={handleUpdateClassDetail}
              isAdminAuthenticate={isAdminAuthenticated}
              classDate={classDate}
              classId={classId}
            />
          ) : (
            <p>No classes available.</p>
          )}
        </div>

        <div className={styles.classDetails__classDetail}>
          <InstructorClassDetail
            classDetail={classDetail}
            timeZone="Asia/Manila"
          />
        </div>
      </div>
    </div>
  );
}

export default ClassDetails;
