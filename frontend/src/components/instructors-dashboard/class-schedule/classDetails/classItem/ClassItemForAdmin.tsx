import { formatTime24Hour, getEndTime } from "@/lib/utils/dateUtils";
import { useState } from "react";
import styles from "./ClassItem.module.scss";
import ClassStatus from "@/components/features/classDetail/classStatus/ClassStatus";
import { UsersIcon } from "@heroicons/react/24/solid";
import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import CheckboxInput from "@/components/elements/checkboxInput/CheckboxInput";
import { useRouter } from "next/navigation";
import {
  handleAttendanceUpdate,
  handleChildChange,
  handleClassStatusUpdate,
} from "@/lib/utils/classItemHandlers";

const ClassItemForAdmin = ({
  adminId,
  instructorId,
  classItem,
  classId,
  isUpdatingData,
  setIsUpdatingData,
  previousPage,
}: ClassItemForAdminProps) => {
  const initialAttendedChildrenIds = classItem.attendingChildren.map(
    (child) => child.id,
  );
  const [isEditingAttendance, setIsEditingAttendance] =
    useState<boolean>(false);
  const [isEditingStatus, setIsEditingStatus] = useState<boolean>(false);
  const [attendedChildrenIdsToUpdate, setAttendedChildrenIdsToUpdate] =
    useState<number[]>(initialAttendedChildrenIds);
  const [selectedStatus, setSelectedStatus] = useState<ClassStatus | null>(
    null,
  );

  const router = useRouter();

  const statusesForAttendance: ClassStatus[] = [
    "booked",
    "rebooked",
    "completed",
  ];
  const bookedStatuses: ClassStatus[] = [
    "booked",
    "rebooked",
    "completed",
    "canceledByInstructor",
  ];

  const classDateTime = new Date(classItem.dateTime);
  const classStartTime = formatTime24Hour(classDateTime);
  const classStartTimeJST = formatTime24Hour(classDateTime, "Asia/Tokyo");
  const classEndTime = getEndTime(classDateTime);
  const isFreeTrial =
    classItem.isFreeTrial &&
    (classItem.status === "booked" || classItem.status === "rebooked");

  const handleCancelClick = () => {
    if (isEditingAttendance) {
      setAttendedChildrenIdsToUpdate(initialAttendedChildrenIds);
      setIsEditingAttendance(false);
    } else {
      setSelectedStatus(null);
      setIsEditingStatus(false);
    }
  };

  return (
    <div
      key={classItem.id}
      className={`${styles.classItem} ${isFreeTrial ? styles.freeTrial : styles[classItem.status]} ${classItem.id === classId ? styles["classItem--selected"] : ""}`}
      onClick={() => {
        let redirectPath: string;
        switch (previousPage) {
          case "class-list":
            redirectPath = `/admins/class-list/${classItem.id}`;
            break;
          case "class-calendar":
            redirectPath = `/admins/calendar/${instructorId}/class-schedule/${classItem.id}`;
            break;
          case "instructor-list":
            redirectPath = `/admins/instructor-list/${instructorId}/class-schedule/${classItem.id}`;
            break;
          default:
            redirectPath = "/admins/login"; // Redirect login page if no previous page is specified
            break;
        }
        router.replace(redirectPath);
      }}
    >
      <div className={styles.classItem__head}>
        <div className={styles.classItem__classInfo}>
          {isEditingStatus ? (
            <div>
              <CheckboxInput
                label="Completed"
                checked={selectedStatus === "completed"}
                onClick={(e) => e.stopPropagation()}
                onChange={() => setSelectedStatus("completed")}
                className="classItemForAdmin"
              />
              <CheckboxInput
                label="Canceled by Instructor"
                checked={selectedStatus === "canceledByInstructor"}
                onClick={(e) => e.stopPropagation()}
                onChange={() => {
                  setSelectedStatus("canceledByInstructor");
                }}
                className="classItemForAdmin"
              />
            </div>
          ) : (
            <ClassStatus
              status={classItem.status}
              isFreeTrial={isFreeTrial}
              className="classItem"
            />
          )}

          {statusesForAttendance.includes(classItem.status) && (
            <div className={styles.classItem__children}>
              <div className={styles.classItem__childrenIconContainer}>
                <UsersIcon className={styles.classItem__childrenIcon} />
              </div>

              {isEditingAttendance ? (
                <div className={styles.classItem__childrenToEdit}>
                  {classItem.customerChildren.map((child) => (
                    <CheckboxInput
                      key={child.id}
                      label={child.name}
                      checked={attendedChildrenIdsToUpdate.includes(child.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(event) =>
                        handleChildChange(
                          event,
                          child.id,
                          setAttendedChildrenIdsToUpdate,
                        )
                      }
                    />
                  ))}
                </div>
              ) : initialAttendedChildrenIds.length === 0 ? (
                <div className={styles.classItem__childrenToEdit}>Absent</div>
              ) : (
                <div className={styles.classItem__childrenToEdit}>
                  {classItem.attendingChildren
                    .map((child) => child.name)
                    .join(", ")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.classItem__time}>
          <span>{classStartTime}</span>
          <span>(JP: {classStartTimeJST})</span>
        </div>
      </div>

      <div className={styles.classItem__buttons}>
        {isEditingAttendance || isEditingStatus ? (
          <>
            <ActionButton
              btnText="Cancel"
              onClick={(e) => {
                e.stopPropagation();
                handleCancelClick();
              }}
              className="cancelEditing"
              disabled={isUpdatingData}
            />
            {isEditingAttendance && (
              <ActionButton
                btnText="Save Attendance"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAttendanceUpdate({
                    classId: classItem.id,
                    instructorId,
                    classEndTime,
                    initialAttendedChildrenIds,
                    attendedChildrenIdsToUpdate,
                    adminId,
                    setIsUpdatingData,
                    setIsEditingAttendance,
                  });
                }}
                className="editAttendance"
                disabled={isUpdatingData}
              />
            )}
            {isEditingStatus && (
              <ActionButton
                btnText="Save Class Status"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClassStatusUpdate({
                    classId: classItem.id,
                    selectedStatus,
                    classEndTime,
                    instructorId,
                    setIsUpdatingData,
                    adminId,
                    setIsEditingStatus,
                  });
                }}
                className="editAttendance"
                disabled={isUpdatingData}
              />
            )}
          </>
        ) : (
          <>
            {statusesForAttendance.includes(classItem.status) && (
              <ActionButton
                btnText="Edit Attendance"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingAttendance(true);
                }}
                className="editAttendance"
                disabled={isUpdatingData}
              />
            )}
            {bookedStatuses.includes(classItem.status) && (
              <ActionButton
                btnText="Edit Class Status"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingStatus(true);
                }}
                className="completeBtn"
                disabled={isUpdatingData}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClassItemForAdmin;
