"use client";

import { useState, useEffect } from "react";
import styles from "./UpcomingClassesTable.module.scss";
import { formatDate, formatTime } from "@/app/helper/dateUtils";
import { deleteLesson, getLessonsByCustomerId } from "@/app/helper/lessonsApi";

function UpcomingClassesTable({ customerId }: { customerId: string }) {
  const [lessons, setLessons] = useState<LessonType[] | undefined>();

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const lessons = await getLessonsByCustomerId(customerId);
        setLessons(lessons);
      } catch (error) {
        console.error(error);
      }
    };

    fetchLessons();
  }, [customerId]);

  async function handleCancel(lessonId: number) {
    try {
      await deleteLesson(lessonId);

      setLessons((prevLessons) =>
        prevLessons?.filter((lesson) => lesson.id !== lessonId)
      );
    } catch (error) {
      console.error("Failed to delete lesson:", error);
    }
  }

  return (
    <div className={styles.lessonsTable}>
      <div className={styles.lessonsTable__wrapper}>
        <div className={styles.lessonsTable__container}>
          <table className={styles.lessonsTable__desktop}>
            <thead className={styles.lessonsTable__head}>
              <tr>
                <th className={styles.lessonsTable__th}>Date</th>
                <th className={styles.lessonsTable__th}>Time</th>
                <th className={styles.lessonsTable__th}>Instructor</th>
                <th className={styles.lessonsTable__th}>Children</th>
                <th className={styles.lessonsTable__th}>Status</th>
                <th className={styles.lessonsTable__th}></th>
              </tr>
            </thead>
            <tbody className={styles.lessonsTable__body}>
              {lessons?.map((lesson) => {
                const dateTime = new Date(lesson.dateTime);

                const date = formatDate(dateTime, "Asia/Tokyo");
                const japanTime = formatTime(dateTime, "Asia/Tokyo");

                return (
                  <tr key={lesson.id} className={styles.lessonsTable__row}>
                    <td className={styles.lessonsTable__td}>{date}</td>
                    <td className={styles.lessonsTable__td}>
                      <div className={styles.lessonsTable__time}>
                        <p>{japanTime}</p>
                      </div>
                    </td>
                    <td className={styles.lessonsTable__td}>
                      {lesson.instructor.name}
                    </td>
                    <td className={styles.lessonsTable__td}>
                      {lesson.lessonAttendance.name.join(", ")}
                    </td>
                    <td className={styles.lessonsTable__td}>{lesson.status}</td>
                    <td className={styles.lessonsTable__td}>
                      {/* If the customer is strictly required to report attending childrend before every class, the Edit functionality will be added.  */}
                      {/* <button
                        className={styles.lessonsTable__editBtn}
                        onClick={() => handleEdit(lesson.id)}
                      >
                        Edit
                      </button> */}
                      <button
                        className={styles.lessonsTable__cancelBtn}
                        onClick={() => handleCancel(lesson.id)}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UpcomingClassesTable;
