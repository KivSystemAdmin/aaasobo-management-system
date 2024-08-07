import { PencilIcon } from "@heroicons/react/24/outline";
import {
  formatDate,
  formatTime,
  isPastPreviousDayDeadline,
  isPastClassDateTime,
} from "../helper/dateUtils";
import ActionButton from "./ActionButton";
import styles from "./ClassesTable.module.scss";
import RedirectButton from "./RedirectButton";
import Link from "next/link";

const ClassesTable = ({
  classes,
  timeZone,
  selectedClasses,
  toggleSelectClass,
  userId,
  handleBulkCancel,
}: {
  classes: ClassType[] | null;
  timeZone: string;
  selectedClasses: { classId: number; classDateTime: string }[];
  toggleSelectClass: (classId: number, classDateTime: string) => void;
  userId: string;
  handleBulkCancel: () => void;
}) => {
  if (!classes) {
    return <div>No upcoming classes</div>;
  }

  const bookedClasses = classes.filter(
    (eachClass) => eachClass.status === "booked",
  );

  if (bookedClasses.length === 0) {
    return <div>No upcoming classes</div>;
  }

  const showSameDayCancelNotice = bookedClasses.some(
    ({ dateTime }) =>
      isPastPreviousDayDeadline(dateTime, "Asia/Tokyo") &&
      !isPastClassDateTime(dateTime, "Asia/Tokyo"),
  );

  return (
    <div className={styles.classesTable}>
      <div className={styles.classesTable__wrapper}>
        <div className={styles.classesTable__container}>
          <table className={styles.classesTable__desktop}>
            <thead className={styles.classesTable__head}>
              <tr>
                <th className={styles.classesTable__th}>Select</th>
                <th className={styles.classesTable__th}>Date</th>
                <th className={styles.classesTable__th}>Time</th>
                <th className={styles.classesTable__th}>Instructor</th>
                <th className={styles.classesTable__th}>Children</th>
                <th className={styles.classesTable__th}></th>
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

                return (
                  <tr key={eachClass.id} className={styles.classesTable__row}>
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
                    {pastPrevDayDeadline && !pastClassTimeDeadline ? (
                      <td className={styles.classesTable__td}>
                        <Link
                          href={`/customers/${userId}/classes/${eachClass.id}`}
                          passHref
                        >
                          {date}
                        </Link>

                        <span style={{ color: "red" }}>*</span>
                      </td>
                    ) : (
                      <td className={styles.classesTable__td}>
                        <Link
                          href={`/customers/${userId}/classes/${eachClass.id}`}
                          passHref
                        >
                          {date}
                        </Link>
                      </td>
                    )}
                    <td className={styles.classesTable__td}>
                      <div className={styles.classesTable__time}>
                        <p>{japanTime}</p>
                      </div>
                    </td>
                    <td className={styles.classesTable__td}>
                      {eachClass.instructor.nickname}
                    </td>
                    <td className={styles.classesTable__td}>
                      {eachClass.classAttendance.children
                        .map((child) => child.name)
                        .join(", ")}
                    </td>
                    <td className={styles.classesTable__td}>
                      {/* condition 1: before the day of the class => with 'Reschedule' btn*/}
                      {/* condition 2: the same day of the class or after the class starts => 'Reschedule' btn*/}

                      {!pastPrevDayDeadline ? (
                        <>
                          <RedirectButton
                            linkURL={`/customers/${userId}/classes/${eachClass.id}/reschedule`}
                            btnText={"Reschedule"}
                            Icon={PencilIcon}
                            className="rescheduleBtn"
                          />
                        </>
                      ) : (
                        ""
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {showSameDayCancelNotice && (
            <p style={{ marginTop: "5px", fontSize: "0.7em", color: "red" }}>
              * If you need to cancel classes on the same day, please contact
              our staff via LINE. Please note that no make-up classes will be
              available in this case.
            </p>
          )}
          <br />
          <ActionButton
            onClick={handleBulkCancel}
            disabled={selectedClasses.length === 0}
            btnText="Cancel Selected Classes"
          />
        </div>
      </div>
    </div>
  );
};

export default ClassesTable;
