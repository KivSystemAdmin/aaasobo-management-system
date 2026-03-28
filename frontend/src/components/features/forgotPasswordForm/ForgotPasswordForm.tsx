"use client";

import React, { useActionState } from "react";
import styles from "./ForgotPasswordForm.module.scss";
import InputField from "../../elements/inputField/InputField";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import ActionButton from "../../elements/buttons/actionButton/ActionButton";
import Link from "next/link";
import { sendResetEmail } from "@/app/actions/sendResetEmail";
import { useSearchParams } from "next/navigation";
import FormValidationMessage from "../../elements/formValidationMessage/FormValidationMessage";
import { getLoginPath } from "@/lib/utils/validationUtils";

export default function ForgotPasswordForm({
  language,
}: {
  language: LanguageType;
}) {
  const [resultState, formAction] = useActionState(sendResetEmail, undefined);

  const searchParams = useSearchParams();
  const userType = searchParams.get("type") as UserType;

  // Get the login path based on user type.
  const loginHref = getLoginPath(userType);

  return (
    <form action={formAction} className={styles.form}>
      <InputField
        id="email"
        type="email"
        name="email"
        placeholder={language === "ja" ? "メール" : "e-mail"}
        icon={<EnvelopeIcon className={styles.icon} />}
        required={true}
      />

      {/* Hidden input to send necessary data with form submission. */}
      <input type="hidden" name="userType" value={userType ?? ""} />
      <input type="hidden" name="language" value={language ?? "en"} />

      <div className={styles.buttonWrapper}>
        <ActionButton
          btnText={language === "ja" ? "送 信" : "Submit"}
          className="submitBtn"
          type="submit"
        />
      </div>

      <div className={styles.messageWrapper}>
        {resultState?.errorMessage && (
          <FormValidationMessage
            type="error"
            message={resultState.errorMessage}
          />
        )}
        {resultState?.successMessage && (
          <FormValidationMessage
            type="success"
            message={resultState.successMessage}
          />
        )}
      </div>

      <Link className={styles.loginLink} href={loginHref}>
        {language === "ja" ? "ログインページへ戻る" : "Return to login page"}
      </Link>
    </form>
  );
}
