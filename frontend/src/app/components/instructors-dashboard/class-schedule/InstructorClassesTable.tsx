import React, { useEffect, useState } from "react";
import { formatTime, isPastClassEndTime } from "@/app/helper/dateUtils";
import styles from "./InstructorClassesTable.module.scss";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { editClass } from "@/app/helper/classesApi";
import ActionButton from "../../ActionButton";
import { CheckCircleIcon, UsersIcon } from "@heroicons/react/24/solid";

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
  classDate,
  classId,
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
  classDate: string;
  classId: number;
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
    if (
      !isPastClassEndTime(classStart, timeZone) &&
      updatedStatus === "completed"
    ) {
      return alert(
        "You cannot edit the class as it is before the class end time.",
      );
    }

    const attendedChildrenIds = childrenWithoutEditingAttendance
      ? childrenWithoutEditingAttendance.map((child) => child.id)
      : Array.from(selectedChildrenIds);

    const isRebookable = updatedStatus !== "completed";

    try {
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
    <div className={styles.instructorClasses}>
      <div className={styles.instructorClasses__classDate}>{classDate}</div>
      <ToastContainer />

      {classes &&
        classes
          .filter((eachClass) => eachClass.status !== "canceledByCustomer")
          .map((eachClass) => {
            const dateTime = new Date(eachClass.dateTime);
            const philippineTime = formatTime(dateTime, timeZone);

            const statusClass =
              eachClass.status === "booked"
                ? styles.statusBooked
                : eachClass.status === "completed"
                  ? styles.statusCompleted
                  : eachClass.status === "canceledByInstructor"
                    ? styles.statusCanceledByInstructor
                    : styles.statusCanceled;

            return (
              <div
                key={eachClass.id}
                className={`${styles.instructorClasses__classItem} ${statusClass} ${eachClass.id === classId ? styles.currentClassBackground : ""}`}
              >
                <div className={styles.instructorClasses__classItemHead}>
                  <div className={styles.instructorClasses__classInfo}>
                    {isAdminAuthenticate && editingClassId === eachClass.id ? (
                      <div>
                        <label>
                          {!isPastClassEndTime(eachClass.dateTime, timeZone) ? (
                            <>
                              <input
                                type="checkbox"
                                checked={selectedStatus === "booked"}
                                onChange={() => handleStatusChange("booked")}
                              />
                              <span>Booked</span>
                            </>
                          ) : (
                            <>
                              <input
                                type="checkbox"
                                checked={selectedStatus === "completed"}
                                onChange={() => handleStatusChange("completed")}
                              />
                              <span>Completed</span>
                            </>
                          )}
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={selectedStatus === "canceledByInstructor"}
                            onChange={() =>
                              handleStatusChange("canceledByInstructor")
                            }
                          />
                          <span>Canceled by Instructor</span>
                        </label>
                      </div>
                    ) : eachClass.status === "canceledByInstructor" ? (
                      <div
                        className={
                          styles.instructorClasses__classStatusContainer
                        }
                      >
                        <CheckCircleIcon
                          className={`${styles.instructorClasses__classStatusIcon} ${statusClass}`}
                        />
                        <div className={styles.instructorClasses__classStatus}>
                          canceled by instructor
                        </div>
                      </div>
                    ) : (
                      <div
                        className={
                          styles.instructorClasses__classStatusContainer
                        }
                      >
                        <CheckCircleIcon
                          className={`${styles.instructorClasses__classStatusIcon} ${statusClass}`}
                        />
                        <div className={styles.instructorClasses__classStatus}>
                          {eachClass.status}
                        </div>
                      </div>
                    )}

                    <div className={styles.instructorClasses__children}>
                      <UsersIcon
                        className={styles.instructorClasses__childrenIcon}
                      />

                      {editingClassId === eachClass.id ? (
                        <div
                          className={styles.instructorClasses__childrenToEdit}
                        >
                          {eachClass.attendingChildren.map((child) => (
                            <div
                              key={child.id}
                              className={styles.instructorClasses__childToEdit}
                            >
                              <input
                                type="checkbox"
                                checked={selectedChildrenIds.has(child.id)}
                                onChange={(event) =>
                                  handleChildChange(event, child.id)
                                }
                                style={{ marginRight: "0.2rem" }}
                              />
                              <span>{child.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : eachClass.children.length === 0 ? (
                        <div
                          className={styles.instructorClasses__childrenToEdit}
                        >
                          Absent
                        </div>
                      ) : (
                        <div
                          className={styles.instructorClasses__childrenToEdit}
                        >
                          {eachClass.children
                            .map((child) => child.name)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.instructorClasses__time}>
                    {isAdminAuthenticate ? (
                      <Link
                        href={`/admins/instructor-list/${instructorId}/class-schedule/${eachClass.id}`}
                        passHref
                      >
                        {philippineTime}
                      </Link>
                    ) : (
                      <Link
                        href={`/instructors/${instructorId}/class-schedule/${eachClass.id}`}
                        passHref
                      >
                        {philippineTime}
                      </Link>
                    )}
                  </div>
                </div>

                <div className={styles.instructorClasses__buttons}>
                  {editingClassId === eachClass.id &&
                  eachClass.status === "booked" ? (
                    <>
                      <ActionButton
                        btnText="Cancel"
                        onClick={handleCancelClick}
                        className="cancelEditing"
                      />
                      <ActionButton
                        btnText="Complete"
                        onClick={() =>
                          completeClass(
                            eachClass.id,
                            eachClass.attendingChildren,
                            eachClass.dateTime,
                            selectedStatus,
                          )
                        }
                        className="completeBtn"
                      />
                    </>
                  ) : editingClassId === eachClass.id &&
                    eachClass.status === "completed" ? (
                    <>
                      <ActionButton
                        btnText="Cancel"
                        onClick={handleCancelClick}
                        className="cancelEditing"
                      />
                      <ActionButton
                        btnText="Update"
                        onClick={() =>
                          completeClass(
                            eachClass.id,
                            eachClass.attendingChildren,
                            eachClass.dateTime,
                            selectedStatus,
                          )
                        }
                        className="completeBtn"
                      />
                    </>
                  ) : !isAdminAuthenticate &&
                    eachClass.status === "completed" ? (
                    <ActionButton
                      btnText="Edit"
                      onClick={() =>
                        handleEditClick(
                          eachClass.id,
                          eachClass.children,
                          eachClass.dateTime,
                          eachClass.status,
                        )
                      }
                      className="editAttendance"
                    />
                  ) : (
                    <>
                      <ActionButton
                        btnText="Edit"
                        onClick={() =>
                          handleEditClick(
                            eachClass.id,
                            eachClass.children,
                            eachClass.dateTime,
                            eachClass.status,
                          )
                        }
                        className="editAttendance"
                      />
                      <ActionButton
                        btnText="Complete"
                        onClick={() =>
                          completeClass(
                            eachClass.id,
                            eachClass.attendingChildren,
                            eachClass.dateTime,
                            "completed",
                            eachClass.children,
                          )
                        }
                        className="completeBtn"
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
    </div>
  );
};

export default InstructorClassesTable;
