import React, { useEffect, useState } from "react";
import { formatTime, isPastClassEndTime } from "@/app/helper/dateUtils";
import styles from "./InstructorClassesTable.module.scss";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { editClass } from "@/app/helper/classesApi";

type StatusType =
  | "booked"
  | "completed"
  | "canceledByCustomer"
  | "canceledByInstructor";

const InstructorClassesTable = ({
  instructorId,
  selectedDateClasses,
  timeZone,
  handleUpdateClassDetail,
  isAdminAuthenticate,
}: {
  instructorId: number;
  selectedDateClasses: InstructorClassDetail[] | null;
  timeZone: string;
  handleUpdateClassDetail: (
    completedClassId: number,
    attendedChildren: Child[],
    updatedStatus: StatusType,
  ) => void;
  isAdminAuthenticate?: boolean;
}) => {
  const [classes, setClasses] = useState<InstructorClassDetail[] | null>(null);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<Set<number>>(
    new Set(),
  );
  const [selectedStatus, setSelectedStatus] = useState<StatusType>("booked");

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
    status: StatusType,
  ) => {
    if (!isPastClassEndTime(classStart, timeZone) && !isAdminAuthenticate) {
      return alert(
        "You cannot complete the class as it is before the class end time.",
      );
    }
    setEditingClassId(classId);
    const initialCheckedChildren = new Set(children.map((child) => child.id));
    setSelectedChildrenIds(initialCheckedChildren);
    setSelectedStatus(status);
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

  const handleStatusChange = (changedStatus: StatusType) => {
    setSelectedStatus(changedStatus);
  };

  const handleCancelClick = () => {
    setEditingClassId(null);
    setSelectedChildrenIds(new Set());
    setSelectedStatus("booked");
  };

  const completeClass = async (
    classToCompleteId: number,
    registeredChildren: Child[], // All of the initially registered children(recurringClassAttendance.children)
    classStart: string,
    updatedStatus: StatusType,
    childrenWithoutEditingAttendance?: Child[],
  ) => {
    if (!isPastClassEndTime(classStart, timeZone) && !isAdminAuthenticate) {
      return alert(
        "You cannot complete the class as it is before the class end time.",
      );
    }

    const attendedChildrenIds = childrenWithoutEditingAttendance
      ? childrenWithoutEditingAttendance.map((child) => child.id)
      : Array.from(selectedChildrenIds);

    const isRebookable = updatedStatus !== "completed";

    try {
      // Whenever instructor clicks the complete button, the status will be set to "completed"
      const updatedStatus = isAdminAuthenticate ? selectedStatus : "completed";

      await editClass({
        classId: classToCompleteId,
        childrenIds: attendedChildrenIds,
        status: updatedStatus,
        isRebookable: isRebookable,
      });

      setClasses((prev) => {
        if (prev === null) return prev;

        return prev.map((eachClass) =>
          eachClass.id === classToCompleteId
            ? {
                ...eachClass,
                children:
                  childrenWithoutEditingAttendance ||
                  childrenWithoutEditingAttendance ||
                  registeredChildren.filter((child) =>
                    attendedChildrenIds.includes(child.id),
                  ),
                status: updatedStatus,
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
        updatedStatus,
      );
      toast.success("Class status has been updated successfully!");
    } catch (error) {
      console.error("Failed to edit class:", error);
    }

    setEditingClassId(null);
    setSelectedChildrenIds(new Set());
    setSelectedStatus("booked");
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
                        {/* Time */}
                        <td className={styles.classesTable__td}>
                          <div className={styles.classesTable__time}>
                            {philippineTime}
                          </div>
                        </td>

                        {/* Children */}
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

                        {/* Class Status(Only for admin) */}
                        <td className={styles.classesTable__td}>
                          {isAdminAuthenticate &&
                          editingClassId === eachClass.id ? (
                            <div>
                              <label>
                                {!isPastClassEndTime(
                                  eachClass.dateTime,
                                  timeZone,
                                ) ? (
                                  <>
                                    <input
                                      type="checkbox"
                                      checked={selectedStatus === "booked"}
                                      onChange={() =>
                                        handleStatusChange("booked")
                                      }
                                    />
                                    <span>booked</span>
                                  </>
                                ) : (
                                  <>
                                    <input
                                      type="checkbox"
                                      checked={selectedStatus === "completed"}
                                      onChange={() =>
                                        handleStatusChange("completed")
                                      }
                                    />
                                    <span>completed</span>
                                  </>
                                )}
                              </label>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedStatus === "canceledByInstructor"
                                  }
                                  onChange={() =>
                                    handleStatusChange("canceledByInstructor")
                                  }
                                />
                                <span>Canceled by Instructor</span>
                              </label>
                            </div>
                          ) : (
                            <div className={styles.classesTable__time}>
                              <p>{eachClass.status}</p>
                            </div>
                          )}
                        </td>

                        {/* Button */}
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
                                  completeClass(
                                    eachClass.id,
                                    eachClass.attendingChildren,
                                    eachClass.dateTime,
                                    selectedStatus,
                                  )
                                }
                              >
                                Complete
                              </button>
                            </>
                          ) : (
                            <button
                              className={styles.classesTable__button}
                              onClick={() =>
                                handleEditClick(
                                  eachClass.id,
                                  eachClass.children,
                                  eachClass.dateTime,
                                  eachClass.status,
                                )
                              }
                            >
                              Edit
                            </button>
                          )}
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
