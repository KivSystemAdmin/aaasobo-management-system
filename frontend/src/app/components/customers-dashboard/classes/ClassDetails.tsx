import { useEffect, useState } from "react";
import { cancelClass, getClassesByCustomerId } from "@/app/helper/classesApi";
import ClassDetail from "@/app/components/ClassDetail";
import ClassesTable from "@/app/components/ClassesTable";
import RedirectButton from "@/app/components/RedirectButton";
import {
  isPastClassDateTime,
  isPastPreviousDayDeadline,
} from "@/app/helper/dateUtils";

function ClassDetails({
  customerId,
  classId,
  isAdminAuthenticated,
}: {
  customerId: string;
  classId: number;
  isAdminAuthenticated?: boolean;
}) {
  const [classDetail, setClassDetail] = useState<ClassType | null>(null);
  const [classes, setClasses] = useState<ClassType[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<
    { classId: number; classDateTime: string }[]
  >([]);

  const fetchClassDetails = async () => {
    if (!customerId || isNaN(classId)) return;

    if (isAdminAuthenticated) {
      // Set the active tab to the class calendar tab.
      localStorage.setItem("activeCustomerTab", "0");
    }

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
  };

  useEffect(() => {
    fetchClassDetails();
  }, [customerId, classId]);

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

  return (
    <>
      <h1>Class Details</h1>
      <br />
      <ClassDetail
        customerId={customerId}
        classDetail={classDetail}
        timeZone="Asia/Tokyo"
        handleCancel={handleCancel}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      <h2>Upcoming Classes</h2>
      <ClassesTable
        classes={classes}
        timeZone="Asia/Tokyo"
        selectedClasses={selectedClasses}
        toggleSelectClass={toggleSelectClass}
        userId={customerId}
        handleBulkCancel={handleBulkCancel}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      <br />
      {isAdminAuthenticated ? (
        <RedirectButton
          linkURL={`/admins/customer-list/${customerId}`}
          btnText="Back"
          className="backBtn"
        />
      ) : (
        <RedirectButton
          linkURL={`/customers/${customerId}/classes`}
          btnText="Back"
          className="backBtn"
        />
      )}
    </>
  );
}

export default ClassDetails;
