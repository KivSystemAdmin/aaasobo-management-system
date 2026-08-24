import {
  formatYearDateTime,
  hasTimePassed,
  isPastPreviousDayDeadline,
} from "@/lib/utils/dateUtils";
import styles from "./ClassNotification.module.scss";
import {
  CANCELED_BY_CUSTOMER_NOTICE,
  CANCELED_BY_INSTRUCTOR_NOTICE,
  CANCELED_BY_ADMIN_NOTICE,
} from "@/lib/messages/customerDashboard";
import SameDayCancellationNotice from "../sameDayCancellationNotice/SameDayCancellationNotice";
import InfoBanner from "@/components/elements/infoBanner/InfoBanner";

const ClassNotification = ({
  classStatus,
  classStart,
  classEnd,
  rebookableUntil,
  language,
  timeZone,
}: {
  classStatus: ClassStatus;
  classStart: string;
  classEnd: string;
  rebookableUntil: string;
  language: LanguageType;
  timeZone?: string;
}) => {
  const isBookedOrRebooked =
    classStatus === "booked" || classStatus === "rebooked";

  if (
    classStatus === "completed" ||
    (isBookedOrRebooked && hasTimePassed(classEnd))
  )
    return null;

  const isBeforePreviousDayDeadline =
    isBookedOrRebooked && !isPastPreviousDayDeadline(classStart);

  const isSameDayButNotYetEnded =
    isBookedOrRebooked &&
    isPastPreviousDayDeadline(classStart) &&
    !hasTimePassed(classEnd);

  const renderNotice = (): React.ReactNode => {
    switch (true) {
      case isBeforePreviousDayDeadline:
        return language === "ja" ? (
          <p>
            キャンセルが前日まで（日本時間基準）に行われた場合、{" "}
            <span>
              {formatYearDateTime(new Date(rebookableUntil), "ja-JP", timeZone)}
            </span>
            のクラスまで振替できます。
          </p>
        ) : (
          <p>
            If the cancellation is made by the day before (based on Japan time),
            you can rebook up to the class on{" "}
            <span>
              {formatYearDateTime(new Date(rebookableUntil), "en-US", timeZone)}
            </span>
            .
          </p>
        );

      case isSameDayButNotYetEnded:
        return <SameDayCancellationNotice language={language} />;

      case classStatus === "canceledByInstructor":
        return CANCELED_BY_INSTRUCTOR_NOTICE[language];

      case classStatus === "canceledByAdmin":
        return CANCELED_BY_ADMIN_NOTICE[language];

      case classStatus === "canceledByCustomer":
        return CANCELED_BY_CUSTOMER_NOTICE[language];

      default:
        return null;
    }
  };

  const noticeContent = renderNotice();
  if (!noticeContent) return null;

  return (
    <div className={styles.notification}>
      <InfoBanner info={noticeContent} className="classDetail" />
    </div>
  );
};

export default ClassNotification;
