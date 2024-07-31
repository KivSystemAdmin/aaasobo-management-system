import {
  formatDayDate,
  formatFiveMonthsLaterEndOfMonth,
  formatPreviousDay,
  formatTime,
  formatTimeWithAddedMinutes,
  isPastPreviousDayDeadline,
  isPastClassDateTime,
} from "../helper/dateUtils";
import Image from "next/image";
import ActionButton from "./ActionButton";
import RedirectButton from "./RedirectButton";
import { PencilIcon } from "@heroicons/react/24/outline";

const ClassDetail = ({
  customerId,
  classDetail,
  timeZone,
  handleCancel,
}: {
  customerId: string;
  classDetail: ClassType | null;
  timeZone: string;
  handleCancel: (classId: number, classDateTime: string) => void;
}) => {
  if (!classDetail) {
    return <div>No class details available</div>;
  }

  const formatChildren = (children: Child[]) =>
    children.map((child) => child.name).join(", ");

  const renderChildren = () => {
    if (classDetail.status === "booked" || classDetail.status === "completed") {
      return (
        <h3>
          {classDetail.status === "booked"
            ? "Attending Children"
            : "Attended Children"}
          :{" "}
          <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
            {formatChildren(classDetail.classAttendance.children)}
          </span>
        </h3>
      );
    }
    return null;
  };

  const renderClassURL = () => {
    if (classDetail.status === "booked") {
      return (
        <>
          <h3>
            Class URL:{" "}
            <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
              {classDetail.instructor.classURL}
            </span>
          </h3>
          <h3>
            Meeting ID:{" "}
            <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
              {classDetail.instructor.meetingId}
            </span>
          </h3>
          <h3>
            Passcode:{" "}
            <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
              {classDetail.instructor.passcode}
            </span>
          </h3>
        </>
      );
    }
    return null;
  };

  return (
    <div style={{ backgroundColor: "#f9fafb", padding: "15px" }}>
      <h3>【{classDetail.status}】</h3>

      <h3>
        Date:{" "}
        <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
          {formatDayDate(new Date(classDetail.dateTime), timeZone)}
        </span>
      </h3>

      <h3>
        Time:{" "}
        <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
          {formatTime(new Date(classDetail.dateTime), timeZone)} -{" "}
          {formatTimeWithAddedMinutes(
            new Date(classDetail.dateTime),
            timeZone,
            25,
          )}
        </span>
      </h3>

      <h3>
        Instructor:{" "}
        <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
          {classDetail.instructor.name}
        </span>
      </h3>
      <Image
        src={`/instructors/${classDetail.instructor.icon}`}
        alt={classDetail.instructor.name}
        width={100}
        height={100}
        priority
      />

      {renderChildren()}

      {renderClassURL()}

      {/* condition 1: class status: booked, current date&time: before the day of the class */}
      {classDetail.status === "booked" &&
        !isPastPreviousDayDeadline(classDetail.dateTime, "Asia/Tokyo") && (
          <>
            <ActionButton
              onClick={() => handleCancel(classDetail.id, classDetail.dateTime)}
              btnText="Cancel"
              className="cancelBtn"
            />

            <RedirectButton
              linkURL={`/customers/${customerId}/classes/${classDetail.id}/reschedule`}
              btnText={"Reschedule"}
              Icon={PencilIcon}
              className="rescheduleBtn"
            />

            <p>
              ■ This class can be rescheduled until{" "}
              <span style={{ fontWeight: "bold", color: "red" }}>
                {`${formatPreviousDay(new Date(classDetail.dateTime), timeZone)}`}
              </span>
              .
            </p>
            <p>
              ■ If cancelled by{" "}
              <span style={{ fontWeight: "bold", color: "red" }}>
                {`${formatPreviousDay(new Date(classDetail.dateTime), timeZone)}`}
              </span>
              , this class can be rescheduled until{" "}
              <span style={{ fontWeight: "bold", color: "red" }}>
                {`${formatFiveMonthsLaterEndOfMonth(new Date(classDetail.dateTime), timeZone)}`}
              </span>
              .
            </p>
          </>
        )}

      {/* condition 2: class status: booked, current date&time: on the same day of the class, but before the start of the class*/}
      {classDetail.status === "booked" &&
        isPastPreviousDayDeadline(classDetail.dateTime, "Asia/Tokyo") &&
        !isPastClassDateTime(classDetail.dateTime, "Asia/Tokyo") && (
          <>
            <br />
            <p style={{ fontSize: "0.8rem", color: "red" }}>
              ■ If you need to cancel classes on the same day, please contact
              our staff via LINE.
            </p>
            <p style={{ fontSize: "0.8rem", color: "red" }}>
              ■ Please note that no make-up classes will be available in this
              case.
            </p>
          </>
        )}
    </div>
  );
};

export default ClassDetail;
