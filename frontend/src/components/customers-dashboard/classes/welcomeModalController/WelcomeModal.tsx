"use client";

import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import styles from "./WelcomModal.module.scss";
import { markWelcomeSeen } from "@/lib/api/customersApi";
import {
  CHILD_PROFILE_UPDATE_INSTRUCTION_MESSAGE,
  FREE_TRIAL_BOOKING_INSTRUCTION_MESSAGE,
  MEMBERSHIP_INSTRUCTION_MESSAGE,
  LOGIN_REQUIRED_MESSAGE,
  WELCOME_MODAL_TITLE1,
} from "@/lib/messages/customerDashboard";
import { validateSession } from "@/app/actions/validateSession";
import { confirmAndDeclineFreeTrialClass } from "@/lib/utils/confirmAndDeclineFreeTrialClass";
import { errorAlert } from "@/lib/utils/alertUtils";
import { CONTACT_EMAIL, LINE_QR_CODE_URL } from "@/lib/data/contacts";

export default function WelcomeModal({
  customerId,
  language,
  setIsWelcomeModalOpen,
  userSessionType,
}: WelcomeModalProps) {
  const handleClick = async () => {
    const { isValid, error } = await validateSession(customerId);

    if (!isValid) {
      return errorAlert(
        error === "unauthorized"
          ? LOGIN_REQUIRED_MESSAGE[language]
          : (error as string),
      );
    }

    await markWelcomeSeen(customerId);

    setIsWelcomeModalOpen(false);
  };

  return (
    <div className={styles.welcomeModal}>
      <h2 className={styles.welcomeModal__title}>
        {WELCOME_MODAL_TITLE1[language]}
      </h2>

      <p className={styles.welcomeModal__description}>
        ⚫︎ {FREE_TRIAL_BOOKING_INSTRUCTION_MESSAGE[language]}
      </p>
      {/* <p className={styles.welcomeModal__declineClass}>
        {language === "ja"
          ? "※ 無料トライアルクラスが不要な方は、"
          : "※ If you don't need a free trial class, "}
        <span
          className={styles.welcomeModal__link}
          onClick={() =>
            confirmAndDeclineFreeTrialClass({
              customerId,
              userSessionType,
              language,
            })
          }
        >
          {language === "ja" ? "こちら" : "click here"}
        </span>
        {language === "ja" ? "をクリックしてください。" : "."}
      </p> */}

      <p className={styles.welcomeModal__description}>
        ⚫︎ {CHILD_PROFILE_UPDATE_INSTRUCTION_MESSAGE[language]}
      </p>

      <p className={styles.welcomeModal__description}>
        ⚫︎ {MEMBERSHIP_INSTRUCTION_MESSAGE[language].beforeLine}
        <a
          href={LINE_QR_CODE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.welcomeModal__link}
        >
          {MEMBERSHIP_INSTRUCTION_MESSAGE[language].lineText}
        </a>
        {MEMBERSHIP_INSTRUCTION_MESSAGE[language].middle}
        {CONTACT_EMAIL}
        {MEMBERSHIP_INSTRUCTION_MESSAGE[language].afterEmail}
      </p>

      <div className={styles.welcomeModal__button}>
        <ActionButton
          btnText={language == "ja" ? "はじめる" : "Get Started"}
          className="startBtn"
          type="button"
          onClick={handleClick}
        />
      </div>
    </div>
  );
}
