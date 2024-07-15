"use client";

import { useState, useEffect } from "react";
import styles from "./UpcomingClassesTable.module.scss";
import { formatDate, formatTime } from "@/app/helper/dateUtils";
import { deleteClass, getClassesByCustomerId } from "@/app/helper/classesApi";
import EditButton from "../EditButton";

function UpcomingClassesTable({ customerId }: { customerId: string }) {
  const [classes, setClasses] = useState<ClassType[] | undefined>();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classes = await getClassesByCustomerId(customerId);
        setClasses(classes);
      } catch (error) {
        console.error(error);
      }
    };

    fetchClasses();
  }, [customerId]);

  async function handleCancel(classId: number) {
    try {
      await deleteClass(classId);

      setClasses((prevClasses) =>
        prevClasses?.filter((eachClass) => eachClass.id !== classId),
      );
    } catch (error) {
      console.error("Failed to delete class:", error);
    }
  }

  return (
    <div className={styles.classesTable}>
      <div className={styles.classesTable__wrapper}>
        <div className={styles.classesTable__container}>
          <table className={styles.classesTable__desktop}>
            <thead className={styles.classesTable__head}>
              <tr>
                <th className={styles.classesTable__th}>Date</th>
                <th className={styles.classesTable__th}>Time</th>
                <th className={styles.classesTable__th}>Instructor</th>
                <th className={styles.classesTable__th}>Children</th>
                <th className={styles.classesTable__th}>Status</th>
                <th className={styles.classesTable__th}></th>
              </tr>
            </thead>
            <tbody className={styles.classesTable__body}>
              {classes?.map((eachClass) => {
                const dateTime = new Date(eachClass.dateTime);

                const date = formatDate(dateTime, "Asia/Tokyo");
                const japanTime = formatTime(dateTime, "Asia/Tokyo");

                return (
                  <tr key={eachClass.id} className={styles.classesTable__row}>
                    <td className={styles.classesTable__td}>{date}</td>
                    <td className={styles.classesTable__td}>
                      <div className={styles.classesTable__time}>
                        <p>{japanTime}</p>
                      </div>
                    </td>
                    <td className={styles.classesTable__td}>
                      {eachClass.instructor.name}
                    </td>
                    <td className={styles.classesTable__td}>
                      {eachClass.classAttendance.children
                        .map((child) => child.name)
                        .join(", ")}
                    </td>
                    <td className={styles.classesTable__td}>
                      {eachClass.status}
                    </td>
                    <td className={styles.classesTable__td}>
                      <EditButton
                        linkURL={`/customers/${customerId}/dashboard/home/${eachClass.id}/edit`}
                        btnText="Edit Class"
                      />
                      <button
                        className={styles.classesTable__cancelBtn}
                        onClick={() => handleCancel(eachClass.id)}
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
