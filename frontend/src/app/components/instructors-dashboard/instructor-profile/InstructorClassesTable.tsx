import React, { useEffect, useState } from "react";
import { formatTime, isPastClassEndTime } from "@/app/helper/dateUtils";
import styles from "./InstructorClassesTable.module.scss";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { editClass } from "@/app/helper/classesApi";

const InstructorClassesTable = ({
  instructorId,
  selectedDateClasses,
  timeZone,
  handleUpdateClassDetail,
}: {
  instructorId: number;
  selectedDateClasses: InstructorClassDetail[] | null;
  timeZone: string;
  handleUpdateClassDetail: (
    completedClassId: number,
    attendedChildren: Child[],
  ) => void;
}) => {
  const [classes, setClasses] = useState<InstructorClassDetail[] | null>(null);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<Set<number>>(
    new Set(),
  );

  if (!selectedDateClasses) {
    return <div>No classes</div>;
  }

  useEffect(() => {
    setClasses(selectedDateClasses);
  }, [selectedDateClasses]);

  const handleEditClick = (
    classId: number,
    children: Child[],
    classStart: string,
  ) => {
    if (!isPastClassEndTime(classStart, timeZone)) {
      return alert(
        "You cannot complete the class as it is before the class end time.",
      );
    }
    setEditingClassId(classId);
    const initialCheckedChildren = new Set(children.map((child) => child.id));
    setSelectedChildrenIds(initialCheckedChildren);
  };

  const handleChildChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    changedChildId: number,
  ) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      selectedChildrenIds.add(changedChildId);
    } else {
      selectedChildrenIds.delete(changedChildId);
    }
    setSelectedChildrenIds(new Set(selectedChildrenIds));
  };

  const handleCancelClick = () => {
    setEditingClassId(null);
    setSelectedChildrenIds(new Set());
  };

  const completeClass = async (
    classToCompleteId: number,
    registeredChildren: Child[], // All of the initially registered children(recurringClassAttendance.children)
    classStart: string,
    childrenWithoutEditingAttendance?: Child[],
  ) => {
    if (!isPastClassEndTime(classStart, timeZone)) {
      return alert(
        "You cannot complete the class as it is before the class end time.",
      );
    }

    const attendedChildrenIds = childrenWithoutEditingAttendance
      ? childrenWithoutEditingAttendance.map((child) => child.id)
      : Array.from(selectedChildrenIds);

    try {
      await editClass({
        classId: classToCompleteId,
        childrenIds: attendedChildrenIds,
        status: "completed",
        isRebookable: false,
      });

      setClasses((prev) => {
        if (prev === null) return prev;
        return prev.map((eachClass) =>
          eachClass.id === classToCompleteId
            ? {
                ...eachClass,
                children:
                  childrenWithoutEditingAttendance ||
                  registeredChildren.filter((child) =>
                    attendedChildrenIds.includes(child.id),
                  ),
                status: "completed",
              }
            : eachClass,
        );
      });

      handleUpdateClassDetail(
        classToCompleteId,
        childrenWithoutEditingAttendance ||
          registeredChildren.filter((child) =>
            attendedChildrenIds.includes(child.id),
          ),
      );
      toast.success("Class has been completed successfully!");
    } catch (error) {
      console.error("Failed to edit class:", error);
    }

    setEditingClassId(null);
    setSelectedChildrenIds(new Set());
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.classesTable}>
        <div className={styles.classesTable__wrapper}>
          <div className={styles.classesTable__container}>
            <table className={styles.classesTable__desktop}>
              <thead className={styles.classesTable__head}>
                <tr>
                  <th className={styles.classesTable__th}>Time</th>
                  <th className={styles.classesTable__th}>Children</th>
                  <th className={styles.classesTable__th}>Class Status</th>
                  <th className={styles.classesTable__th}></th>
                </tr>
              </thead>
              <tbody className={styles.classesTable__body}>
                {classes &&
                  classes.map((eachClass) => {
                    const dateTime = new Date(eachClass.dateTime);
                    const philippineTime = formatTime(dateTime, timeZone);

                    return (
                      <tr
                        key={eachClass.id}
                        className={styles.classesTable__row}
                      >
                        <td className={styles.classesTable__td}>
                          <div className={styles.classesTable__time}>
                            <Link
                              href={`/instructors/${instructorId}/class-schedule/${eachClass.id}`}
                              passHref
                            >
                              {philippineTime}
                            </Link>
                          </div>
                        </td>

                        <td className={styles.classesTable__td}>
                          {editingClassId === eachClass.id ? (
                            <div className={styles.classesTable__children}>
                              {/* All of the initially registered children(recurringClassAttendance.children) are shown when 'Edit' button is clicked 
                              in case instructors make a mistake in attendance report or non-registered children for the class attend the class*/}
                              {eachClass.attendingChildren.map((child) => (
                                <div
                                  key={child.id}
                                  className={styles.classesTable__child}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedChildrenIds.has(child.id)}
                                    onChange={(event) =>
                                      handleChildChange(event, child.id)
                                    }
                                  />
                                  <span>{child.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : eachClass.children.length === 0 ? (
                            "Absent"
                          ) : (
                            eachClass.children
                              .map((child) => child.name)
                              .join(", ")
                          )}
                        </td>
                        <td className={styles.classesTable__td}>
                          <div className={styles.classesTable__time}>
                            <p>{eachClass.status}</p>
                          </div>
                        </td>
                        <td className={styles.classesTable__td}>
                          {editingClassId === eachClass.id ? (
                            <>
                              <button
                                className={styles.classesTable__button}
                                onClick={handleCancelClick}
                              >
                                Cancel
                              </button>
                              <button
                                className={styles.classesTable__button}
                                onClick={() =>
                                  // Condition 1: Editing attendance is necessary
                                  completeClass(
                                    eachClass.id,
                                    eachClass.attendingChildren, // attendingChildren = recurringClassAttendance.children(initially registered children)
                                    eachClass.dateTime,
                                  )
                                }
                              >
                                Complete
                              </button>
                            </>
                          ) : eachClass.status === "completed" ? (
                            <button
                              className={styles.classesTable__button}
                              onClick={() =>
                                handleEditClick(
                                  eachClass.id,
                                  eachClass.children,
                                  eachClass.dateTime,
                                )
                              }
                            >
                              Edit
                            </button>
                          ) : eachClass.status === "booked" ? (
                            <>
                              <button
                                className={styles.classesTable__button}
                                onClick={() =>
                                  handleEditClick(
                                    eachClass.id,
                                    eachClass.children,
                                    eachClass.dateTime,
                                  )
                                }
                              >
                                Edit
                              </button>
                              <button
                                className={styles.classesTable__button}
                                onClick={() =>
                                  // Condition 2: Editing attendance is not necessary
                                  completeClass(
                                    eachClass.id,
                                    eachClass.attendingChildren,
                                    eachClass.dateTime,
                                    eachClass.children,
                                  )
                                }
                              >
                                Complete
                              </button>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstructorClassesTable;
