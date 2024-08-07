"use client";

import { useEffect, useState } from "react";
import RedirectButton from "@/app/components/RedirectButton";
import { getClassesByInstructorId } from "@/app/helper/classesApi";
import { formatDate } from "@/app/helper/dateUtils";
import InstructorClassDetail from "@/app/components/instructors-dashboard/instructor-profile/InstructorClassDetail";
import InstructorClassesTable from "@/app/components/instructors-dashboard/instructor-profile/InstructorClassesTable";

const Page = ({ params }: { params: { id: string; classId: string } }) => {
  const instructorId = parseInt(params.id);
  const classId = parseInt(params.classId);
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
  ) => {
    if (completedClassId !== classId) return;

    setClassDetail((prev) => {
      if (prev === null) return prev;

      return {
        ...prev,
        children: attendedChildren,
        status: "completed",
      };
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <h1>Class Details</h1>
      <br />
      <InstructorClassDetail classDetail={classDetail} timeZone="Asia/Manila" />

      <h2>{`Classes (${classDate})`}</h2>
      <InstructorClassesTable
        instructorId={instructorId}
        selectedDateClasses={selectedDateClasses}
        timeZone="Asia/Manila"
        handleUpdateClassDetail={handleUpdateClassDetail}
      />

      <br />
      <RedirectButton
        linkURL={`/instructors/${instructorId}/class-schedule`}
        btnText="Back"
        className="backBtn"
      />
    </>
  );
};

export default Page;
