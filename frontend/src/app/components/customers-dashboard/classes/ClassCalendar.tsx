import React, { useEffect, useRef, useState } from "react";
import CalendarHeader from "@/app/components/CalendarHeader";
import CalendarView from "@/app/components/CalendarView";
import styles from "./ClassCalendar.module.scss";
import FullCalendar from "@fullcalendar/react";
import { CalendarApi } from "@fullcalendar/core/index.js";
import {
  formatFiveMonthsLaterEndOfMonth,
  getClassStartAndEndTimes,
  isPastPreviousDayDeadline,
} from "@/app/helper/dateUtils";
import { cancelClass, fetchClassesForCalendar } from "@/app/helper/classesApi";
import RedirectButton from "@/app/components/RedirectButton";
import { PlusIcon } from "@heroicons/react/24/outline";
import Modal from "@/app/components/Modal";
import ActionButton from "../../ActionButton";
import ClassesTable from "../../ClassesTable";

function ClassCalendar({
  customerId,
  isAdminAuthenticated,
}: {
  customerId: string;
  isAdminAuthenticated?: boolean;
}) {
  const [classesForCalendar, setClassesForCalendar] = useState<EventType[]>([]);
  const [classes, setClasses] = useState<ClassForCalendar[] | null>(null);
  const [calendarApi, setCalendarApi] = useState<CalendarApi | null>(null);
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

  const calendarRef = useRef<FullCalendar | null>(null);

  const fetchData = async () => {
    try {
      const classesData: ClassForCalendar[] = await fetchClassesForCalendar(
        parseInt(customerId),
        "customer",
      );

      setClasses(classesData);

      const rebookableClasses = classesData
        .filter(
          (eachClass) =>
            (eachClass.status === "canceledByCustomer" &&
              eachClass.isRebookable) ||
            (eachClass.status === "canceledByInstructor" &&
              eachClass.isRebookable),
        )
        .sort((a, b) => {
          const dateA = new Date(a.dateTime).getTime();
          const dateB = new Date(b.dateTime).getTime();
          return dateA - dateB;
        });
      setRebookableClasses(rebookableClasses);

      const formattedClasses = classesData.map((eachClass) => {
        const { start, end } = getClassStartAndEndTimes(
          eachClass.dateTime,
          "Asia/Tokyo",
        );

        const color =
          eachClass.status === "booked"
            ? "#65b72f"
            : eachClass.status === "completed"
              ? "#b5c4ab"
              : "#d9d9d9";

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
        };
      });

      setClassesForCalendar(formattedClasses);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
      alert("Failed to get classes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [customerId]);

  useEffect(() => {
    // Only set calendarApi if calendarRef is not null
    if (calendarRef.current) {
      setCalendarApi(calendarRef.current.getApi());
    }
  }, [calendarRef.current]);

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
    // 'Page' is the parent component of 'CalendarHeader' and 'CalendarView' children components.
    // 'CalendarHeader' and 'CalendarView' are initially independent from each other, but 'Page' can connect them together
    // by passing 'calendarRef' to 'CalendarView' and retrieving the FullCalendar API instance from it and making the API available for 'CalendarHeader'using state
    <div className={styles.calendarContainer}>
      {isLoading ? (
        <div className={styles.loadingContainer}>Loading ...</div>
      ) : (
        <>
          <CalendarHeader calendarApi={calendarApi ?? null} />

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

          <CalendarView
            // Create a ref to access the FullCalendar instance in CalendarView;
            ref={calendarRef}
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
              {/* Content of the Modal */}
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
