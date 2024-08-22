"use client";

import { useEffect, useState, useCallback } from "react";
import { cancelClass, getClassesByCustomerId } from "@/app/helper/classesApi";
import ClassDetail from "@/app/components/ClassDetail";
import ClassesTable from "@/app/components/ClassesTable";
import RedirectButton from "@/app/components/RedirectButton";
import {
  isPastClassDateTime,
  isPastPreviousDayDeadline,
} from "@/app/helper/dateUtils";

const ClassDetailPage = ({
  params,
}: {
  params: { id: string; classId: string };
}) => {
  const customerId = params.id;
  const classId = parseInt(params.classId);
  const [classDetail, setClassDetail] = useState<ClassType | null>(null);
  const [classes, setClasses] = useState<ClassType[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<
    { classId: number; classDateTime: string }[]
  >([]);

  const fetchClassDetails = useCallback(async () => {
    if (!customerId || isNaN(classId)) return;

    try {
      const classes: ClassType[] = await getClassesByCustomerId(customerId);
      setClasses(classes);

      const classDetail = classes.find((eachClass) => eachClass.id === classId);
      setClassDetail(classDetail || null);
    } catch (error) {
      console.error("Failed to fetch class details:", error);
      setError("Failed to load class details. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [classId, customerId]);

  useEffect(() => {
    fetchClassDetails();
  }, [fetchClassDetails]);

  const handleCancel = async (classId: number, classDateTime: string) => {
    const isPastPreviousDay = isPastPreviousDayDeadline(
      classDateTime,
      "Asia/Tokyo",
    );

    if (isPastPreviousDay)
      return alert(
        "Classes cannot be canceled on or after the scheduled day of the class.",
      );

    const confirmed = window.confirm(
      "Do you really want to cancel this class?",
    );
    if (!confirmed) return;
    try {
      await cancelClass(classId);
      await fetchClassDetails();
    } catch (error) {
      console.error("Failed to cancel the class:", error);
      setError("Failed to cancel the class. Please try again later.");
    }
  };

  const handleBulkCancel = async () => {
    if (selectedClasses.length === 0) return;

    // Get classes that have passes the previous day cancelation deadline
    const pastPrevDayClasses = selectedClasses.filter((eachClass) =>
      isPastPreviousDayDeadline(eachClass.classDateTime, "Asia/Tokyo"),
    );

    if (pastPrevDayClasses.length > 0) {
      alert(
        "Classes cannot be canceled on or after the scheduled day of the class.",
      );
      const pastPrevDayClassIds = new Set(
        pastPrevDayClasses.map((pastClass) => pastClass.classId),
      );
      const updatedSelectedClasses = selectedClasses.filter(
        (eachClass) => !pastPrevDayClassIds.has(eachClass.classId),
      );
      return setSelectedClasses(updatedSelectedClasses);
    }

    // Get classes that are before the previous day's deadline
    const classesToCancel = selectedClasses.filter(
      (eachClass) =>
        !isPastPreviousDayDeadline(eachClass.classDateTime, "Asia/Tokyo"),
    );

    if (classesToCancel.length > 0) {
      const confirmed = window.confirm(
        `Are you sure you want to cancel these ${selectedClasses.length} classes?`,
      );
      if (!confirmed) return setSelectedClasses([]);
      try {
        await Promise.all(
          classesToCancel.map((eachClass) => cancelClass(eachClass.classId)),
        );
        fetchClassDetails();
        setSelectedClasses([]);
      } catch (error) {
        console.error("Failed to cancel classes:", error);
        setError("Failed to cancel the classes. Please try again later.");
      }
    }
  };

  const toggleSelectClass = (classId: number, classDateTime: string) => {
    setSelectedClasses((prev) => {
      const updated = prev.filter((item) => item.classId !== classId);
      if (updated.length === prev.length) {
        updated.push({ classId, classDateTime });
      }
      return updated;
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const handleModalClose = async () => {
    // TODO: Implement
    throw new Error("Not implemented");
  };

  const handleCancelingModalClose = async () => {
    // TODO: Implement
    throw new Error("Not implemented");
  };

  return (
    <>
      <h1>Class Details</h1>
      <br />
      <ClassDetail
        customerId={customerId}
        classDetail={classDetail}
        timeZone="Asia/Tokyo"
        handleCancel={handleCancel}
        handleModalClose={handleModalClose}
      />

      <h2>Upcoming Classes</h2>
      <ClassesTable
        classes={classes}
        timeZone="Asia/Tokyo"
        selectedClasses={selectedClasses}
        toggleSelectClass={toggleSelectClass}
        userId={customerId}
        handleBulkCancel={handleBulkCancel}
        handleCancelingModalClose={handleCancelingModalClose}
      />

      <br />
      <RedirectButton
        linkURL={`/customers/${customerId}/classes`}
        btnText="Back"
        className="backBtn"
      />
    </>
  );
};

export default ClassDetailPage;
