import React, { useEffect, useRef, useState, useCallback } from "react";
import CalendarView from "@/app/components/CalendarView";
import styles from "./ClassCalendar.module.scss";
import FullCalendar from "@fullcalendar/react";
import {
  formatFiveMonthsLaterEndOfMonth,
  isPastPreviousDayDeadline,
} from "@/app/helper/dateUtils";
import { cancelClass, fetchClassesForCalendar } from "@/app/helper/classesApi";
import RedirectButton from "@/app/components/RedirectButton";
import { PlusIcon } from "@heroicons/react/24/outline";
import Modal from "@/app/components/Modal";
import ActionButton from "../../ActionButton";
import ClassesTable from "../../ClassesTable";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ClassCalendar({
  customerId,
  isAdminAuthenticated,
}: {
  customerId: string;
  isAdminAuthenticated?: boolean;
}) {
  const [classesForCalendar, setClassesForCalendar] = useState<EventType[]>([]);
  const [classes, setClasses] = useState<ClassForCalendar[] | null>(null);
  const [rebookableClasses, setRebookableClasses] = useState<
    ClassForCalendar[] | undefined
  >(undefined);
  const [selectedClasses, setSelectedClasses] = useState<
    { classId: number; classDateTime: string }[]
  >([]);
  const [isBookableClassesModalOpen, setIsBookableClassesModalOpen] =
    useState(false);
  const [isCancelingModalOpen, setIsCancelingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const classesData: ClassForCalendar[] = await fetchClassesForCalendar(
        parseInt(customerId),
        "customer",
      );

      setClasses(classesData);

      const rebookableClasses = classesData
        .filter((eachClass) => {
          const fiveMonthsLaterEndOfMonth = new Date(
            formatFiveMonthsLaterEndOfMonth(eachClass.dateTime, "Asia/Tokyo"),
          );

          const now = new Date(
            new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
          );

          return (
            ((eachClass.status === "canceledByCustomer" &&
              eachClass.isRebookable) ||
              (eachClass.status === "canceledByInstructor" &&
                eachClass.isRebookable)) &&
            now <= fiveMonthsLaterEndOfMonth
          );
        })
        .sort((a, b) => {
          const dateA = new Date(a.dateTime).getTime();
          const dateB = new Date(b.dateTime).getTime();
          return dateA - dateB;
        });
      setRebookableClasses(rebookableClasses);

      const formattedClasses = classesData.map((eachClass) => {
        const start = eachClass.dateTime;
        const end = new Date(
          new Date(start).getTime() + 25 * 60000,
        ).toISOString();

        const color =
          eachClass.status === "booked"
            ? "#E7FBD9"
            : eachClass.status === "completed"
              ? "#B5C4AB"
              : "#FFEBE0";

        const childrenNames = eachClass.classAttendance.children
          .map((child) => child.name)
          .join(", ");

        return {
          classId: eachClass.id,
          start,
          end,
          title: childrenNames,
          color,
          instructorIcon: eachClass.instructor?.icon,
          instructorNickname: eachClass.instructor?.nickname,
          classStatus: eachClass.status,
        };
      });

      setClassesForCalendar(formattedClasses);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
      alert("Failed to get classes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelingModalClose = () => {
    setIsCancelingModalOpen(false);
    setSelectedClasses([]);
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
      if (!confirmed) return handleCancelingModalClose();
      try {
        await Promise.all(
          classesToCancel.map((eachClass) => cancelClass(eachClass.classId)),
        );
        setSelectedClasses([]);

        // Re-fetch data to update the state
        fetchData();
        handleCancelingModalClose();
        toast.success("The classes have been successfully canceled!");
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

  if (error) return <div>{error}</div>;

  return (
    <div className={styles.calendarContainer}>
      {isLoading ? (
        <div className={styles.loadingContainer}>Loading ...</div>
      ) : (
        <>
          <div className={styles.calendarHeaderContainer}>
            <div className={styles.calendarActions}>
              <div className={styles.calendarActions__container}>
                <div className={styles.calendarActions__canceling}>
                  <ActionButton
                    btnText="Cancel Classes"
                    className="cancelClasses"
                    onClick={() => {
                      setIsCancelingModalOpen(true);
                    }}
                  />
                </div>
                <div className={styles.calendarActions__booking}>
                  <p
                    onClick={() =>
                      rebookableClasses &&
                      rebookableClasses.length > 0 &&
                      setIsBookableClassesModalOpen(true)
                    }
                    className={`${styles.bookableClasses} ${rebookableClasses && rebookableClasses.length > 0 ? styles.clickable : ""}`}
                  >
                    Bookable Classes: {rebookableClasses?.length ?? 0}
                  </p>
                  {isAdminAuthenticated ? (
                    <RedirectButton
                      linkURL={`/admins/customer-list/${customerId}/classes/book`}
                      btnText="Book Class"
                      Icon={PlusIcon}
                      className="bookClass"
                      disabled={rebookableClasses?.length === 0}
                    />
                  ) : (
                    <RedirectButton
                      linkURL={`/customers/${customerId}/classes/book`}
                      btnText="Book Class"
                      Icon={PlusIcon}
                      className="bookClass"
                      disabled={rebookableClasses?.length === 0}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <CalendarView
            events={classesForCalendar}
            // TODO: Fetch holidays from the backend
            // holidays={["2024-07-29", "2024-07-30", "2024-07-31"]}
            customerId={parseInt(customerId)}
            isAdminAuthenticated={isAdminAuthenticated}
            fetchData={fetchData}
          />

          <Modal
            isOpen={isBookableClassesModalOpen}
            onClose={() => setIsBookableClassesModalOpen(false)}
          >
            <div className={styles.modal}>
              <h2>Bookable Classes</h2>
              <ul className={styles.modal__list}>
                {rebookableClasses?.map((eachClass, index) => (
                  <li key={eachClass.id}>
                    {index + 1} : until{" "}
                    {formatFiveMonthsLaterEndOfMonth(
                      eachClass.dateTime,
                      "Asia/Tokyo",
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Modal>

          <Modal
            isOpen={isCancelingModalOpen}
            onClose={handleCancelingModalClose}
          >
            <div className={styles.modal}>
              {/* Content of the Modal */}
              <ClassesTable
                classes={classes}
                timeZone="Asia/Tokyo"
                selectedClasses={selectedClasses}
                toggleSelectClass={toggleSelectClass}
                handleBulkCancel={handleBulkCancel}
                userId={customerId}
                isAdminAuthenticated
                handleCancelingModalClose={handleCancelingModalClose}
              />
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}

export default ClassCalendar;
