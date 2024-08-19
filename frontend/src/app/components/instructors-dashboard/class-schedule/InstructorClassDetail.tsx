import {
  formatBirthdateToISO,
  formatDate,
  formatTime,
  formatTimeWithAddedMinutes,
  getDay,
  getDayOfWeek,
  getShortMonth,
  isPastClassEndTime,
} from "@/app/helper/dateUtils";
import styles from "./InstructorClassDetail.module.scss";
import CheckCircleIcon from "@heroicons/react/24/solid/CheckCircleIcon";
import {
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserIcon,
  VideoCameraIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { UserIcon as UserIconOutline } from "@heroicons/react/24/outline";

const InstructorClassDetail = ({
  classDetail,
  timeZone,
}: {
  classDetail: InstructorClassDetail | null;
  timeZone: string;
}) => {
  if (!classDetail) {
    return <div>No class details available</div>;
  }

  const renderChildren = () => {
    const childrenToDisplay = classDetail.children;

    // Check if there are no children to display
    if (childrenToDisplay.length === 0) {
      return (
        <h3>
          {classDetail.status === "completed"
            ? "Attended Children"
            : "Attending Children"}
          :{" "}
          <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
            The registered children were absent.
          </span>
        </h3>
      );
    }

    return (
      <div>
        <h3>
          {classDetail.status === "booked"
            ? "Attending Children"
            : "Attended Children"}
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Name</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Date of Birth
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Personal Info
              </th>
            </tr>
          </thead>
          <tbody>
            {childrenToDisplay.map((child) => (
              <tr key={child.id}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {child.name}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {child.birthdate
                    ? formatDate(new Date(child.birthdate), timeZone)
                    : "N/A"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {child.personalInfo || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const statusClass =
    classDetail.status === "booked"
      ? styles.statusBooked
      : classDetail.status === "completed"
        ? styles.statusCompleted
        : classDetail.status === "canceledByInstructor"
          ? styles.statusCanceledByInstructor
          : styles.statusCanceled;

  return (
    <div className={styles.classCardContainer}>
      <div className={styles.classCardContainer__title}>Class Details</div>
      <div className={`${styles.classCard} ${statusClass}`}>
        {/* Class Status */}
        <div className={styles.classStatus}>
          <div className={styles.classStatus__iconContainer}>
            {classDetail.status === "booked" ||
            classDetail.status === "completed" ? (
              <CheckCircleIcon
                className={`${styles.classStatus__icon} ${statusClass}`}
              />
            ) : classDetail.status === "canceledByInstructor" ? (
              <ExclamationTriangleIcon
                className={`${styles.classStatus__icon} ${statusClass}`}
              />
            ) : (
              <XCircleIcon
                className={`${styles.classStatus__icon} ${statusClass}`}
              />
            )}
          </div>

          <div className={styles.classStatus__name}>
            {classDetail.status === "booked"
              ? "Booked"
              : classDetail.status === "completed"
                ? "Completed"
                : classDetail.status === "canceledByCustomer"
                  ? "Canceled by Customer"
                  : classDetail.status === "canceledByInstructor"
                    ? "Canceled by Instructor"
                    : "Unknown Status"}
          </div>
        </div>

        {/* Date & TIme */}
        <div className={styles.dateTime}>
          <div className={styles.dateTime__iconContainer}>
            <CalendarDaysIcon className={styles.dateTime__icon} />
          </div>

          <div className={styles.dateTime__details}>
            <div className={styles.dateTime__date}>
              <div className={styles.dateTime__day}>
                {getDay(classDetail.dateTime, timeZone)}
              </div>
              <div className={styles.dateTime__month}>
                {getShortMonth(classDetail.dateTime, timeZone)}
              </div>
            </div>

            <div className={styles.dateTime__time}>
              <div className={styles.dateTime__dayOfWeek}>
                {getDayOfWeek(classDetail.dateTime, timeZone)}
              </div>
              <div className={styles.dateTime__classTime}>
                {formatTime(new Date(classDetail.dateTime), timeZone)} -{" "}
                {formatTimeWithAddedMinutes(
                  new Date(classDetail.dateTime),
                  timeZone,
                  25,
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Class URL */}
        {classDetail.status === "booked" &&
        !isPastClassEndTime(classDetail.dateTime, "Asia/Tokyo") ? (
          <div className={styles.classURL}>
            <div className={styles.classURL__iconContainer}>
              <VideoCameraIcon className={styles.classURL__icon} />
            </div>
            <div className={styles.classURL__details}>
              <div className={styles.classURL__url}>
                <a
                  href={classDetail.classURL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {classDetail.classURL}
                </a>
              </div>
              <div className={styles.classURL__password}>
                Meeting ID: {classDetail.meetingId}
              </div>
              <div className={styles.classURL__password}>
                Passcode: {classDetail.passcode}
              </div>
            </div>
          </div>
        ) : (
          ""
        )}

        {/* Children */}
        <div className={styles.children}>
          <div className={styles.children__title}>
            {classDetail.status === "booked"
              ? "Attending Children"
              : "Attended Children"}
          </div>

          {classDetail.children.length === 0 ? (
            <div className={styles.children__header}>
              <div className={styles.children__iconContainer}>
                <UserIconOutline className={styles.children__icon} />
              </div>
              <div className={styles.children__nameContainer}>
                <div className={styles.children__nameTitle}>
                  The registered children were absent.
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.children__contentContainer}>
              {classDetail.children.map((child) => (
                <div key={child.id} className={styles.children__content}>
                  <div className={styles.children__header}>
                    <div className={styles.children__iconContainer}>
                      <UserIconOutline className={styles.children__icon} />
                    </div>
                    <div className={styles.children__nameContainer}>
                      <div className={styles.children__nameTitle}>Name</div>
                      <div className={styles.children__name}>{child.name}</div>
                    </div>
                  </div>
                  <div className={styles.children__birthdateContainer}>
                    <div className={styles.children__birthdateTitle}>
                      Birthdate
                    </div>
                    <div className={styles.children__birthdate}>
                      {child.birthdate
                        ? formatBirthdateToISO(child.birthdate)
                        : "N/A"}
                    </div>
                  </div>
                  <div className={styles.children__personalInfoContainer}>
                    <div className={styles.children__personalInfoTitle}>
                      Notes
                    </div>
                    <div className={styles.children__personalInfo}>
                      {child.personalInfo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guardian */}
        <div className={styles.guardian}>
          <div className={styles.guardian__iconContainer}>
            <UserIcon className={styles.guardian__icon} />
          </div>
          <div className={styles.guardian__name}>
            Guardian: {classDetail.customerName}
          </div>
        </div>

        {/* Notification */}
        {classDetail.status === "booked" ? (
          <div className={styles.notification}>
            <div className={styles.notification__iconContainer}>
              <InformationCircleIcon className={styles.notification__icon} />
            </div>
            <p>
              If you need to cancel a class, please contact our staff promptly
              via Facebook.
            </p>
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default InstructorClassDetail;
