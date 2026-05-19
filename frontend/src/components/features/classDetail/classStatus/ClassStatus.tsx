import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import styles from "./ClassStatus.module.scss";

const ClassStatus = ({
  status,
  isFreeTrial,
  language,
  className,
}: {
  status: ClassStatus;
  isFreeTrial: boolean;
  language?: LanguageType;
  className?: string;
}) => {
  const languageClass = language === "ja" ? styles.ja : styles.en;

  const statusIconMap: Partial<Record<ClassStatus, React.ElementType>> = {
    booked: CheckCircleIcon,
    rebooked: CheckCircleIcon,
    completed: CheckCircleIcon,
    canceledByInstructor: ExclamationTriangleIcon,
    canceledByAdmin: ExclamationTriangleIcon,
    canceledByCustomer: XCircleIcon,
  };

  const IconComponent = statusIconMap[status] ?? CheckCircleIcon;

  const statusLabelMap: Partial<
    Record<ClassStatus, { ja: string; en: string }>
  > = {
    booked: { ja: "レギュラークラス", en: "Regular Class" },
    rebooked: { ja: "振替クラス", en: "Rebooked Class" },
    completed: { ja: "終了", en: "Completed" },
    canceledByCustomer: { ja: "キャンセル", en: "Canceled" },
    canceledByInstructor: { ja: "キャンセル", en: "Canceled by Instructor" },
    canceledByAdmin: { ja: "キャンセル", en: "Admin Canceled" },
    freeTrial: { ja: "無料トライアルクラス", en: "Free Trial Class" },
  };

  const renderStatusLabel = () => {
    return (
      statusLabelMap[isFreeTrial ? "freeTrial" : status]?.[
        language === "ja" ? "ja" : "en"
      ] ?? (language === "ja" ? "不明なクラス" : "Unknown Status")
    );
  };

  return (
    <div
      className={`${styles.classStatus}  ${className ? styles[className] : ""}`}
    >
      <IconComponent
        className={`${styles.classStatus__icon} ${styles[isFreeTrial ? "freeTrial" : status]}`}
      />
      <div className={`${styles.classStatus__label} ${languageClass}`}>
        {renderStatusLabel()}
        {status === "canceledByInstructor" && language === "ja" && (
          <span>（インストラクター都合）</span>
        )}
        {status === "canceledByAdmin" && language === "ja" && (
          <span>（事務局都合）</span>
        )}
      </div>
    </div>
  );
};

export default ClassStatus;
