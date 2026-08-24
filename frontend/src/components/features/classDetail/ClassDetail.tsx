"use client";

import {
  isPastPreviousDayDeadline,
  formatClassDetailFooter,
} from "../../../lib/utils/dateUtils";
import ActionButton from "../../elements/buttons/actionButton/ActionButton";
import styles from "./ClassDetail.module.scss";
import { UsersIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import ClassStatus from "./classStatus/ClassStatus";
import ClassDateTime from "./classDateTime/ClassDateTime";
import ClassUrl from "./classUrl/ClassUrl";
import ClassNotification from "./classNotification/ClassNotification";
import ClassInstructor from "./classInstructor/ClassInstructor";
import {
  CANCEL_CLASS_CONFIRM_MESSAGE,
  CANNOT_CANCEL_ON_OR_AFTER_CLASS_DAY,
  NO_CLASS_DETAILS,
} from "@/lib/messages/customerDashboard";
import { cancelClassAction } from "@/app/actions/cancelSelectedClasses";
import { confirmAlert, errorAlert } from "@/lib/utils/alertUtils";
import { useCustomerTimeZone } from "@/contexts/CustomerTimeZoneContext";

const ClassDetail = ({
  customerId,
  classDetail,
  handleModalClose,
  language,
  userSessionType,
}: ClassDetailProps) => {
  const customerTimeZone = useCustomerTimeZone();

  if (!classDetail) {
    return <div>{NO_CLASS_DETAILS[language]}</div>;
  }

  const isFreeTrial =
    classDetail.isFreeTrial &&
    (classDetail.classStatus === "booked" ||
      classDetail.classStatus === "rebooked");
  const statusesForAttendance: ClassStatus[] = [
    "booked",
    "rebooked",
    "completed",
  ];
  const statusesForCancelBtn: ClassStatus[] = ["booked", "rebooked"];

  const handleCancel = async (
    classId: number,
    classDateTime: string,
    customerId: number,
  ) => {
    const isAfterPreviousDayDeadline = isPastPreviousDayDeadline(classDateTime);

    const confirmed = await confirmAlert(
      CANCEL_CLASS_CONFIRM_MESSAGE[language],
    );
    if (!confirmed) return;

    if (isAfterPreviousDayDeadline)
      return errorAlert(CANNOT_CANCEL_ON_OR_AFTER_CLASS_DAY[language]);

    const cancelationResult = await cancelClassAction(
      classId,
      customerId,
      userSessionType,
    );

    if (!cancelationResult.success)
      return errorAlert(cancelationResult.message[language]);

    handleModalClose();
    toast.success(cancelationResult.message[language]);
  };

  return (
    <div
      className={`${styles.classCard} ${isFreeTrial ? styles.freeTrial : styles[classDetail.classStatus]}`}
    >
      <ClassStatus
        status={classDetail.classStatus}
        isFreeTrial={isFreeTrial}
        language={language}
      />

      <ClassInstructor
        classStatus={isFreeTrial ? "freeTrial" : classDetail.classStatus}
        instructorIcon={classDetail.instructorIcon}
        instructorNickname={classDetail.instructorNickname}
      />

      <ClassDateTime
        classStart={classDetail.start}
        language={language}
        timeZone={customerTimeZone || undefined}
      />

      {/* Children Attendance */}
      {statusesForAttendance.includes(classDetail.classStatus) && (
        <div className={styles.children}>
          <div className={styles.children__iconContainer}>
            <UsersIcon className={styles.children__icon} />
          </div>
          <div className={styles.children__names}>{classDetail.title}</div>
        </div>
      )}

      <ClassUrl
        classEnd={classDetail.end}
        classStatus={classDetail.classStatus}
        classUrl={classDetail.instructorClassURL}
        meetingId={classDetail.instructorMeetingId}
        passCode={classDetail.instructorPasscode}
        language={language}
      />

      {/* Cancel Booking button */}
      {/* Only render if the class is "booked" or "rebooked" and hasn't passed the previous-day deadline. */}
      {statusesForCancelBtn.includes(classDetail.classStatus) &&
        !isPastPreviousDayDeadline(classDetail.start) && (
          <div className={styles.buttons}>
            <ActionButton
              onClick={() =>
                handleCancel(classDetail.classId, classDetail.start, customerId)
              }
              btnText={
                language === "ja" ? "予約をキャンセル" : "Cancel Booking"
              }
              className="cancelBooking"
            />
          </div>
        )}

      <ClassNotification
        classStatus={classDetail.classStatus}
        classStart={classDetail.start}
        classEnd={classDetail.end}
        rebookableUntil={classDetail.rebookableUntil}
        language={language}
        timeZone={customerTimeZone || undefined}
      />

      <div className={styles.footer}>
        <span>
          {language === "ja" ? "クラスコード" : "Class Code"} :{" "}
          {classDetail.classCode}
        </span>
        <span>{formatClassDetailFooter(classDetail.updatedAt)}</span>
      </div>
    </div>
  );
};

export default ClassDetail;
