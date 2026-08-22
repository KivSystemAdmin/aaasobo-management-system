import {
  formatTime24Hour,
  formatTimeWithAddedMinutes,
  formatYearDate,
  getDayOfWeek,
  getShortMonth,
} from "@/lib/utils/dateUtils";
import styles from "./ClassDateTime.module.scss";
import { CalendarDaysIcon } from "@heroicons/react/24/solid";

const ClassDateTime = ({
  classStart,
  language,
  timeZone,
}: {
  classStart: string;
  language?: LanguageType;
  timeZone?: string;
}) => {
  const classDateTime = new Date(classStart);
  const classDate = formatYearDate(
    classDateTime,
    language == "ja" ? "ja-JP" : "en-US",
    timeZone,
  );
  const classMonth = getShortMonth(classDateTime, "en-US", timeZone);
  const classDay = Number(
    new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone }).format(
      classDateTime,
    ),
  );
  const classDayOfWeek = getDayOfWeek(classDateTime, "en-US", timeZone);
  const classStartTime = formatTime24Hour(classDateTime, timeZone);
  const classEndTime = formatTimeWithAddedMinutes(classDateTime, 25, timeZone);

  return (
    <div className={styles.dateTime}>
      <div className={styles.dateTime__iconContainer}>
        <CalendarDaysIcon className={styles.dateTime__icon} />
      </div>

      {language == "ja" ? (
        <>
          <div className={styles.dateTime__detailsJa}>
            <div className={styles.dateTime__dateJa}>{classDate}</div>

            <div className={styles.dateTime__classTimeJa}>
              {classStartTime} - {classEndTime}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.dateTime__details}>
            <div className={styles.dateTime__date}>
              <div className={styles.dateTime__day}>{classDay}</div>
              <div className={styles.dateTime__month}>{classMonth}</div>
            </div>

            <div className={styles.dateTime__time}>
              <div className={styles.dateTime__dayOfWeek}>{classDayOfWeek}</div>
              <div className={styles.dateTime__classTime}>
                {classStartTime} - {classEndTime}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClassDateTime;
