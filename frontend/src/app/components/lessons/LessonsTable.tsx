"use client";

import { useState, useEffect } from "react";
import styles from "./LessonsTable.module.scss";
import { formatDate, formatTime } from "@/app/helper/dateUtils";

function LessonsTable() {
  const [lessons, setLessons] = useState<LessonType[] | undefined>();

  useEffect(() => {
    const getLessons = async () => {
      try {
        const response = await fetch("http://localhost:4000/lessons");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { lessons } = await response.json();
        setLessons(lessons);
      } catch (error) {
        console.error(error);
      }
    };

    getLessons();
  }, []);

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
                <th className={styles.lessonsTable__th}>Customer</th>
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
                      {lesson.customer.name}
                    </td>
                    <td className={styles.lessonsTable__td}>{lesson.status}</td>
                    {/* <td className={styles.lessonsTable__td}>
                    <div className={styles.lessonsTable__actions}>
                      <UpdateLesson id={lesson.id} />
                      <DeleteLesson id={lesson.id} />
                    </div>
                  </td> */}
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

export default LessonsTable;
