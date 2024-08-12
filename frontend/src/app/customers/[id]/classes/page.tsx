"use client";

import React, { useEffect, useRef, useState } from "react";
import CalendarHeader from "@/app/components/CalendarHeader";
import CalendarView from "@/app/components/CalendarView";
import styles from "./page.module.scss";
import FullCalendar from "@fullcalendar/react";
import { CalendarApi } from "@fullcalendar/core/index.js";
import {
  formatFiveMonthsLaterEndOfMonth,
  getClassStartAndEndTimes,
} from "@/app/helper/dateUtils";
import {
  fetchClassesForCalendar,
  getClassesByCustomerId,
} from "@/app/helper/classesApi";
import RedirectButton from "@/app/components/RedirectButton";
import { PlusIcon } from "@heroicons/react/24/outline";
import Modal from "@/app/components/Modal";

const Page = ({ params }: { params: { id: string } }) => {
  const customerId = params.id;
  const [classesForCalendar, setClassesForCalendar] = useState<EventType[]>([]);
  const [calendarApi, setCalendarApi] = useState<CalendarApi | null>(null);
  const [rebookableClasses, setRebookableClasses] = useState<
    ClassType[] | undefined
  >(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    if (!customerId) return;

    const fetchData = async () => {
      try {
        const classes: ClassForCalendar[] = await fetchClassesForCalendar(
          parseInt(customerId),
          "customer",
        );

        const formattedClasses = classes.map((eachClass) => {
          const { start, end } = getClassStartAndEndTimes(
            eachClass.dateTime,
            "Asia/Tokyo",
          );

          const color =
            eachClass.status === "booked"
              ? "#FF0000"
              : eachClass.status === "completed"
                ? "#99FF99"
                : "#C0C0C0";

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

    fetchData();
  }, [customerId]);

  useEffect(() => {
    // Only set calendarApi if calendarRef is not null
    if (calendarRef.current) {
      setCalendarApi(calendarRef.current.getApi());
    }
  }, [calendarRef.current]);

  useEffect(() => {
    const fetchRebookableClassesByCustomerId = async (customerId: string) => {
      try {
        const classes: ClassType[] = await getClassesByCustomerId(customerId);
        const rebookableClasses = classes.filter(
          (eachClass) =>
            (eachClass.status === "canceledByCustomer" &&
              eachClass.isRebookable) ||
            (eachClass.status === "canceledByInstructor" &&
              eachClass.isRebookable),
        );
        setRebookableClasses(rebookableClasses);
      } catch (error) {
        console.error("Failed to fetch rebookable classes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRebookableClassesByCustomerId(customerId);
  }, []);

  const handleModalOpen = () => {
    if (rebookableClasses && rebookableClasses.length > 0) {
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

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

          <div className={styles.calendarInstruction}>
            <div className={styles.calendarInstruction__legends}>
              <span className={`${styles.legend} ${styles.legendBooked}`}>
                booked
              </span>
              <span className={`${styles.legend} ${styles.legendCompleted}`}>
                completed
              </span>
              <span className={`${styles.legend} ${styles.legendCanceled}`}>
                canceled
              </span>
            </div>

            <div className={styles.calendarInstruction__book}>
              <p
                onClick={handleModalOpen}
                className={`${styles.bookableClasses} ${rebookableClasses && rebookableClasses.length > 0 ? styles.clickable : ""}`}
              >
                Bookable Classes: {rebookableClasses?.length ?? 0}
              </p>

              <RedirectButton
                linkURL={`/customers/${customerId}/classes/book`}
                btnText="Book Class"
                Icon={PlusIcon}
                className="bookBtn"
                disabled={rebookableClasses?.length === 0}
              />
            </div>
          </div>

          <CalendarView
            // Create a ref to access the FullCalendar instance in CalendarView;
            ref={calendarRef}
            events={classesForCalendar}
            // TODO: Fetch holidays from the backend
            holidays={["2024-07-29", "2024-07-30", "2024-07-31"]}
            customerId={parseInt(customerId)}
          />

          <Modal isOpen={isModalOpen} onClose={handleModalClose}>
            <div className={styles.modal}>
              <h2>Rebookable Classes</h2>
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
        </>
      )}
    </div>
  );
};

export default Page;
