import {
  DayCellContentArg,
  DayCellMountArg,
  EventContentArg,
} from "@fullcalendar/core";
import styles from "../../components/features/calendarView/CalendarView.module.scss";
import Image from "next/image";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { formatTime24Hour } from "./dateUtils";

export const createRenderEventContent = (userType: UserType) => {
  const RenderEventContent = (eventInfo: EventContentArg) => {
    const classDateTime = new Date(eventInfo.event.startStr);
    const classTime = formatTime24Hour(classDateTime);

    const { title } = eventInfo.event;
    const { instructorIcon, instructorNickname, classStatus } =
      eventInfo.event.extendedProps;

    const isCustomer = userType === "customer";
    const isClickable = isCustomer || title !== "No booked class";

    return (
      <div
        className={styles.eventBlock}
        style={{
          cursor: isClickable ? "pointer" : "default",
        }}
      >
        {isCustomer &&
        (classStatus === "booked" || classStatus === "rebooked") &&
        instructorIcon ? (
          <Image
            src={instructorIcon}
            alt={instructorNickname || "Instructor"}
            width={30}
            height={30}
            priority
            unoptimized
            className={`${styles.instructorIcon} ${styles[classStatus]}`}
          />
        ) : classStatus === "completed" ? (
          <div className={styles.classStatusIcon}>
            <CheckCircleIcon className={styles.classStatusIcon__completed} />
          </div>
        ) : classStatus === "canceledByCustomer" ? (
          <div className={styles.classStatusIcon}>
            <XCircleIcon className={styles.classStatusIcon__canceled} />
          </div>
        ) : classStatus === "canceledByInstructor" ? (
          <div className={styles.classStatusIcon}>
            <ExclamationTriangleIcon
              className={styles.classStatusIcon__canceled}
            />
          </div>
        ) : null}

        <div
          className={`${styles.eventDetails} ${
            classStatus === "booked"
              ? styles.booked
              : classStatus === "rebooked"
                ? styles.rebooked
                : classStatus === "completed"
                  ? styles.completed
                  : classStatus === "canceledByCustomer" ||
                      classStatus === "canceledByInstructor"
                    ? styles.canceled
                    : ""
          }`}
        >
          <div className={styles.eventTime}>{classTime} -</div>
          <div className={styles.eventTitle}>{title}</div>
        </div>
      </div>
    );
  };

  return RenderEventContent;
};

export const getValidRange = (createdAt: string, monthsAhead: number) => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1);

  return {
    start: createdAt.split("T")[0],
    end: end.toISOString().split("T")[0],
  };
};

export const getClassSlotTimesForCalendar = () => {
  // Step 1: Get the user's timezone offset from UTC in minutes
  const timezoneOffsetMinutes = new Date().getTimezoneOffset();

  // Step 2: Define class start and end times in UTC (23:00 and 13:00 UTC / 08:00 and 22:00 in Japan).
  // To account for possible daylight saving time shifts in some time zones, subtract one hour from the start time and add one hour to the end time.
  // The year (1970) and date (January 1st & 2nd) are arbitrary and used just to construct the Date objects.
  const utcClassesStart = new Date(Date.UTC(1970, 0, 1, 23, 0, 0)); // 23:00 UTC / 08:00 JST
  const utcClassesEnd = new Date(Date.UTC(1970, 0, 2, 13, 0, 0)); // 13:00 UTC / 22:00 JST

  // Step 3: Adjust UTC times to the user's local time by subtracting the timezone offset
  const localClassesStart = new Date(
    utcClassesStart.getTime() - timezoneOffsetMinutes * 60 * 1000,
  );
  const localClassesEnd = new Date(
    utcClassesEnd.getTime() - timezoneOffsetMinutes * 60 * 1000,
  );

  // Step 4: Format the local times to "HH:mm:ss" for the calendar
  const formatTime = (date: Date) => date.toISOString().substring(11, 19);
  const classesStartTime = formatTime(localClassesStart);
  const classesEndTime = formatTime(localClassesEnd);

  // Step 5: Compare classes start time and end time
  // In some time zones (e.g., Vancouver), class crosses midnight (e.g., start at 16:00, end at 06:00).
  // In such cases, return null to display the full range of time slots (00:00–24:00) on the weekly calendar.
  const classesStartHour = parseInt(classesStartTime.substring(0, 2), 10); // e.g.,"16:00" -> 16
  const classesEndHour = parseInt(classesEndTime.substring(0, 2), 10);

  if (classesStartHour > classesEndHour) {
    return null;
  }

  return {
    start: classesStartTime,
    end: classesEndTime,
  };
};

export function getDayCellColorHandler(
  businessSchedule: { date: string; color: string }[],
): (arg: DayCellMountArg) => void {
  const dateToColorMap = new Map<string, string>(
    businessSchedule.map((item) => [item.date, item.color]),
  );

  return (arg: DayCellMountArg) => {
    if (arg.isOther) return;

    // Get offset in minutes from UTC
    const offset = new Date().getTimezoneOffset();

    // Adjust the date to the local timezone by subtracting the offset
    const localDate = new Date(arg.date.getTime() - offset * 60 * 1000);
    const dateStr = localDate.toISOString().split("T")[0];
    const color = dateToColorMap.get(dateStr);

    if (color) {
      arg.el.style.backgroundColor = color;
    }
  };
}

// Calculate the first day of the previous year (e.g., 20XX-01-01)
const firstDayOfPreviousYear = () => {
  const now = new Date();
  return new Date(now.getFullYear() - 1, 0, 2).toISOString().split("T")[0];
};

// Calculate the valid range (from 1 year ago to 1 year later) for the business calendar
export const businessCalendarValidRange = () => {
  const firstDay = firstDayOfPreviousYear();
  return getValidRange(firstDay, 24 - new Date().getMonth());
};
