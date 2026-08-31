"use client";

import Table from "@/components/elements/table/Table";
import styles from "./RebookableClassesList.module.scss";
import InfoBanner from "@/components/elements/infoBanner/InfoBanner";
import {
  FREE_TRIAL_BOOKING_ELIGIBILITY_NOTE,
  TODAYS_CLASS_REBOOKING_NOTICE,
} from "@/lib/messages/customerDashboard";
import RebookableClassList from "../../rebookableClassList/RebookableClassList";

export default function RebookableClassesList({
  customerId,
  adminId,
  rebookableClasses,
  onRebookableClassSelect,
  language,
  userSessionType,
  childProfiles,
}: RebookableClassesListProps) {
  const hasRebookableClasses = rebookableClasses.length > 0;
  const hasFreeTrial =
    hasRebookableClasses &&
    rebookableClasses.some((classItem) => classItem.isFreeTrial === true);
  const hasClassToRebook =
    hasRebookableClasses &&
    rebookableClasses.some((classItem) => classItem.isFreeTrial === false);

  const rebookableTitle =
    language === "ja"
      ? hasFreeTrial
        ? "予約するクラスをお選びください"
        : "振替予約するクラスをお選びください"
      : hasFreeTrial
        ? "Please select the class to book."
        : "Please select the class to rebook.";

  const noRebookableTitle =
    language === "ja"
      ? hasFreeTrial
        ? "現在、予約可能なクラスがありません。"
        : "現在、振替可能なクラスがありません。"
      : hasFreeTrial
        ? "No bookable classes are available."
        : "No rebookable classes are available.";

  const headItems =
    language === "ja"
      ? hasFreeTrial
        ? ["予約可能クラス", ""]
        : ["振替可能クラス", ""]
      : hasFreeTrial
        ? ["Bookable Classes", ""]
        : ["Rebookable Classes", ""];

  return (
    <div className={styles.modal}>
      {hasRebookableClasses ? (
        <>
          <h3 className={styles.modal__title}>{rebookableTitle}</h3>

          <Table className="rebookableClassList" headItems={headItems}>
            <RebookableClassList
              customerId={customerId}
              adminId={adminId}
              rebookableClasses={rebookableClasses}
              onRebookableClassSelect={onRebookableClassSelect}
              language={language}
              userSessionType={userSessionType}
              childProfiles={childProfiles}
            />
          </Table>

          {hasFreeTrial && (
            <InfoBanner info={FREE_TRIAL_BOOKING_ELIGIBILITY_NOTE[language]} />
          )}

          {hasClassToRebook && (
            <InfoBanner info={TODAYS_CLASS_REBOOKING_NOTICE[language]} />
          )}
        </>
      ) : (
        <h3 className={styles.modal__title}>{noRebookableTitle}</h3>
      )}
    </div>
  );
}
