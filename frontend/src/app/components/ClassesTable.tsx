import {
  formatDate,
  formatTime,
  isPastPreviousDayDeadline,
  isPastClassDateTime,
} from "../helper/dateUtils";
import ActionButton from "./ActionButton";
import styles from "./ClassesTable.module.scss";
import Image from "next/image";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

const ClassesTable = ({
  classes,
  timeZone,
  selectedClasses,
  toggleSelectClass,
  userId,
  handleBulkCancel,
  isAdminAuthenticated,
  handleCancelingModalClose,
}: {
  classes: ClassForCalendar[] | ClassType[] | null;
  timeZone: string;
  selectedClasses: { classId: number; classDateTime: string }[];
  toggleSelectClass: (classId: number, classDateTime: string) => void;
  userId: string;
  handleBulkCancel: () => void;
  isAdminAuthenticated?: boolean;
  handleCancelingModalClose: () => void;
}) => {
  if (!classes) {
    return <div>No upcoming classes</div>;
  }

  const bookedClasses = classes
    .filter(
      (eachClass) =>
        eachClass.status === "booked" &&
        !isPastClassDateTime(eachClass.dateTime, "Asia/Tokyo"),
    )
    .sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    );

  if (bookedClasses.length === 0) {
    return <div>No upcoming classes</div>;
  }

  const showSameDayCancelNotice = bookedClasses.some(
    ({ dateTime }) =>
      isPastPreviousDayDeadline(dateTime, "Asia/Tokyo") &&
      !isPastClassDateTime(dateTime, "Asia/Tokyo"),
  );

  const handleRowClick = (classId: number, dateTime: string) => {
    if (isPastPreviousDayDeadline(dateTime, "Asia/Tokyo")) return;
    toggleSelectClass(classId, dateTime);
  };

  return (
    <div className={styles.classesTable__wrapper}>
      <div className={styles.classesTable__container}>
        <div className={styles.classesTable__tableWrapper}>
          <table className={styles.classesTable__table}>
            <thead className={styles.classesTable__head}>
              <tr>
                <th className={styles.classesTable__th}></th>
                <th className={styles.classesTable__th}>Date</th>
                <th className={styles.classesTable__th}>Time</th>
                <th className={styles.classesTable__th}>Instructor</th>
                <th className={styles.classesTable__th}>Children</th>
              </tr>
            </thead>
            <tbody className={styles.classesTable__body}>
              {bookedClasses.map((eachClass) => {
                const dateTime = new Date(eachClass.dateTime);
                const date = formatDate(dateTime, timeZone);
                const japanTime = formatTime(dateTime, timeZone);
                const pastPrevDayDeadline = isPastPreviousDayDeadline(
                  eachClass.dateTime,
                  "Asia/Tokyo",
                );
                const pastClassTimeDeadline = isPastClassDateTime(
                  eachClass.dateTime,
                  "Asia/Tokyo",
                );

                // Check if the current class is selected
                const isSelected = selectedClasses.some(
                  (item) =>
                    item.classId === eachClass.id &&
                    item.classDateTime === eachClass.dateTime,
                );

                return (
                  <tr
                    key={eachClass.id}
                    className={`${styles.classesTable__row} ${isSelected ? styles.classesTable__rowSelected : ""} ${pastPrevDayDeadline ? styles.tableRowDisabled : ""}`}
                    onClick={() =>
                      handleRowClick(eachClass.id, eachClass.dateTime)
                    }
                  >
                    <td className={styles.classesTable__td}>
                      {/* condition 1: before the day of the class => with checkbox*/}
                      {/* condition 2: the same day of the class or after the class starts => no checkbox*/}
                      {!pastPrevDayDeadline ? (
                        <input
                          type="checkbox"
                          checked={selectedClasses.some(
                            (item) => item.classId === eachClass.id,
                          )}
                          onChange={() =>
                            toggleSelectClass(eachClass.id, eachClass.dateTime)
                          }
                        />
                      ) : (
                        ""
                      )}
                    </td>

                    <td className={styles.classesTable__td}>
                      <div className={styles.classesTable__dateContainer}>
                        <div className={styles.classesTable__date}>{date}</div>

                        {pastPrevDayDeadline && !pastClassTimeDeadline ? (
                          <InformationCircleIcon
                            className={styles.classesTable__infoIcon}
                          />
                        ) : null}
                      </div>
                    </td>

                    <td className={styles.classesTable__td}>
                      <div className={styles.classesTable__time}>
                        <p>{japanTime}</p>
                      </div>
                    </td>

                    <td className={styles.classesTable__td}>
                      <div className={styles.classesTable__instructorContainer}>
                        <Image
                          src={`/instructors/${eachClass.instructor.icon}`}
                          alt={eachClass.instructor.nickname}
                          width={40}
                          height={40}
                          priority
                          className={styles.classesTable__instructorIcon}
                        />
                        <div className={styles.classesTable__instructorName}>
                          {eachClass.instructor.nickname}
                        </div>
                      </div>
                    </td>

                    <td className={styles.classesTable__td}>
                      {eachClass.classAttendance.children
                        .map((child) => child.name)
                        .join(", ")}
                    </td>

                    {/* <td className={styles.classesTable__td}> */}
                    {/* condition 1: before the day of the class => with 'Reschedule' btn*/}
                    {/* condition 2: the same day of the class or after the class starts => 'Reschedule' btn*/}

                    {/* {!pastPrevDayDeadline ? (
                         isAdminAuthenticated ? (
                           <RedirectButton
                             linkURL={`/admins/customer-list/${userId}/classes/${eachClass.id}/reschedule`}
                             btnText={"Reschedule"}
                             Icon={PencilIcon}
                             className="rescheduleBtn"
                           />
                         ) : (
                           <RedirectButton
                             linkURL={`/customers/${userId}/classes/${eachClass.id}/reschedule`}
                             btnText={"Reschedule"}
                             Icon={PencilIcon}
                             className="rescheduleBtn"
                           />
                         )
                       ) : (
                         ""
                       )}
                     </td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {showSameDayCancelNotice && (
          <div className={styles.classesTable__noticeContainer}>
            <InformationCircleIcon
              className={styles.classesTable__noticeIcon}
            />
            <div className={styles.classesTable__notice}>
              If you need to cancel today's classes, please contact our staff
              via LINE. Please note that no make-up classes will be available in
              this case.
            </div>
          </div>
        )}
        <div className={styles.classesTable__buttons}>
          <ActionButton
            btnText="Back"
            className="back"
            onClick={handleCancelingModalClose}
          />
          <ActionButton
            onClick={handleBulkCancel}
            disabled={selectedClasses.length === 0}
            btnText="Cancel Selected Classes"
            className="cancelSelectedClasses"
          />
        </div>
      </div>
    </div>
  );
};

export default ClassesTable;
