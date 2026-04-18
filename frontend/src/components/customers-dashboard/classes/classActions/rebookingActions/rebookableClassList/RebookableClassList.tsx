"use client";

import React, { useState } from "react";
import styles from "./RebookableClassList.module.scss";
import {
  formatShortDate,
  formatTime24Hour,
  nHoursBefore,
} from "@/lib/utils/dateUtils";
import {
  FREE_TRIAL_BOOKING_TOO_LATE_NOTICE,
  REBOOKING_TOO_LATE_NOTICE,
} from "@/lib/messages/customerDashboard";
import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import { confirmAndDeclineFreeTrialClass } from "@/lib/utils/confirmAndDeclineFreeTrialClass";
import {
  FREE_TRIAL_BOOKING_HOURS,
  REGULAR_REBOOKING_HOURS,
} from "@/lib/data/data";
import BookingModal from "../../bookingActions/BookingModal";
import { errorAlert } from "@/lib/utils/alertUtils";

export default function RebookableClassList({
  customerId,
  adminId,
  rebookableClasses,
  language,
  userSessionType,
  childProfiles,
}: RebookableClassListProps) {
  const handleRebook = (
    id: number,
    rebookableUntil: Date,
    isFreeTrial: boolean,
    classCode?: string,
    subscription?: Subscription,
  ) => {
    const now = new Date().getTime();

    const hoursBefore = isFreeTrial
      ? FREE_TRIAL_BOOKING_HOURS
      : REGULAR_REBOOKING_HOURS;
    const rebookingDeadline = nHoursBefore(
      hoursBefore,
      new Date(rebookableUntil),
    ).getTime();

    if (now > rebookingDeadline) {
      return errorAlert(
        isFreeTrial
          ? FREE_TRIAL_BOOKING_TOO_LATE_NOTICE[language]
          : REBOOKING_TOO_LATE_NOTICE[language],
      );
    }

    setSelectedClassId(id);
    setSelectedIsFreeTrial(isFreeTrial);
    setSelectedClassCode(classCode || "");
    setPlan(subscription?.plan);
    setModalOpen(true);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedIsFreeTrial, setSelectedIsFreeTrial] =
    useState<boolean>(false);
  const [selectedClassCode, setSelectedClassCode] = useState<string>("");
  const [plan, setPlan] = useState<Plan>();

  return (
    <ul className={styles.modal__list}>
      {rebookableClasses?.map((classItem) => {
        const locale = language === "ja" ? "ja-JP" : "en-US";
        const date = formatShortDate(
          new Date(classItem.rebookableUntil),
          locale,
        );
        const time = formatTime24Hour(new Date(classItem.rebookableUntil));
        const isFreeTrial = classItem.isFreeTrial;

        const dateTimeText = <span>{`${date} ${time}`}</span>;
        const bookableDateTime =
          language === "ja" ? (
            <>
              {dateTimeText} のクラスまで{isFreeTrial ? "予約可能" : "振替可能"}
            </>
          ) : (
            <>
              {isFreeTrial ? "Bookable" : "Rebookable"} until{" "}
              <span>{`${time}`}</span> class, <span>{`${date}`}</span>
            </>
          );

        const btnText =
          language === "ja"
            ? isFreeTrial
              ? "予約"
              : "振替予約"
            : isFreeTrial
              ? "Book"
              : "Rebook";

        return (
          <li key={classItem.id} className={styles.listItem}>
            <div className={styles.listItem__dateTime}>
              <>
                {bookableDateTime}
                {isFreeTrial && (
                  <p className={styles.listItem__declineClass}>
                    {language === "ja"
                      ? "※ 無料トライアルが不要な方は、"
                      : "※ If you don't need a free trial class, "}
                    <button
                      className={styles.listItem__link}
                      onClick={() =>
                        confirmAndDeclineFreeTrialClass({
                          customerId,
                          userSessionType,
                          language,
                          classCode: classItem.classCode,
                        })
                      }
                    >
                      {language === "ja" ? "こちら" : "click here"}
                    </button>
                    {language === "en" && "."}
                  </p>
                )}
              </>
            </div>
            <div className={styles.listItem__classId}>
              <p>{classItem.classCode}</p>
              {isFreeTrial &&
                (language === "ja" ? (
                  <span>無料トライアル</span>
                ) : (
                  <span>Free Trial</span>
                ))}
            </div>
            <div className={styles.listItem__button}>
              <ActionButton
                className="selectRebookingClass"
                btnText={btnText}
                onClick={() =>
                  handleRebook(
                    classItem.id,
                    classItem.rebookableUntil,
                    classItem.isFreeTrial,
                    classItem.classCode,
                    classItem.subscription,
                  )
                }
              />
            </div>
          </li>
        );
      })}

      {selectedClassId && (
        <BookingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          classId={selectedClassId}
          isFreeTrial={selectedIsFreeTrial}
          language={language}
          classCode={selectedClassCode}
          childProfiles={childProfiles}
          customerId={customerId}
          adminId={adminId}
          plan={plan}
        />
      )}
    </ul>
  );
}
