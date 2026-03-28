"use client";

import React, { useActionState, useState } from "react";
import styles from "./ResetPasswordForm.module.scss";
import InputField from "../../elements/inputField/InputField";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import ActionButton from "../../elements/buttons/actionButton/ActionButton";
import Link from "next/link";
import { useInput } from "@/hooks/useInput";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import PasswordStrengthMeter from "../../elements/passwordStrengthMeter/PasswordStrengthMeter";
import { resetPassword } from "@/app/actions/resetPassword";
import FormValidationMessage from "../../elements/formValidationMessage/FormValidationMessage";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getLoginPath,
  getForgotPasswordPath,
} from "@/lib/utils/validationUtils";

export default function ResetPasswordForm({
  token,
  userType,
  tokenVerificationResult,
}: ResetPasswordFormProps) {
  const [password, onPasswordChange] = useInput();
  const [showPassword, setShowPassword] = useState(false);
  const { passwordStrength } = usePasswordStrength(password);

  const [resultState, formAction] = useActionState(resetPassword, undefined);
  const isError = !!resultState?.errorMessage;
  const isErrorWithLink =
    !!resultState?.errorMessageWithResetLink ||
    !!tokenVerificationResult.needsResetLink;
  const isSuccess = !!resultState?.successMessage;

  const { language } = useLanguage();

  // Get login and forgot password paths based on user type.
  const loginHref = getLoginPath(userType);
  const forgotPasswordHref = getForgotPasswordPath(userType);

  return !tokenVerificationResult.valid ? (
    <>
      <h2 className={styles.title}>
        {language === "ja" ? "無効なリンクです" : "Invalid reset link"}
      </h2>

      <div className={styles.messageWrapper}>
        <FormValidationMessage
          type="error"
          message={tokenVerificationResult.message[language]}
        />
      </div>
      {isErrorWithLink && (
        <Link className={styles.link} href={forgotPasswordHref}>
          {language === "ja" ? "リンクを再発行" : "Request link"}
        </Link>
      )}
    </>
  ) : (
    <>
      <h2 className={styles.title}>
        {language === "ja" ? "パスワードを再設定" : "Reset Your Password"}
      </h2>

      <form action={formAction} className={styles.form}>
        <InputField
          id="password"
          label={language === "ja" ? "新しいパスワード" : "New Password"}
          type="password"
          name="password"
          value={password}
          placeholder={
            language === "ja" ? "8文字以上" : "At least 8 characters"
          }
          onChange={(event) => {
            onPasswordChange(event);
          }}
          icon={<LockClosedIcon className={styles.icon} />}
          required={true}
          minLength={8}
          error={resultState?.password}
          showPassword={showPassword}
          onTogglePasswordVisibility={() => setShowPassword((prev) => !prev)}
        />
        <PasswordStrengthMeter
          password={password}
          passwordStrength={passwordStrength}
          language={language}
        />
        <InputField
          id="passConfirmation"
          type="password"
          name="passConfirmation"
          required
          placeholder={
            language === "ja" ? "パスワード再入力" : "Re-enter password"
          }
          icon={<LockClosedIcon className={styles.icon} />}
          error={resultState?.passConfirmation}
          showPassword={showPassword}
          onTogglePasswordVisibility={() => setShowPassword((prev) => !prev)}
          language={language}
        />

        {/* Hidden inputs to send necessary data with form submission. */}
        <input
          type="hidden"
          name="passwordStrength"
          value={passwordStrength ?? ""}
        />
        <input type="hidden" name="userType" value={userType ?? ""} />
        <input type="hidden" name="token" value={token ?? ""} />
        <input type="hidden" name="language" value={language ?? "en"} />

        <div className={styles.buttonWrapper}>
          <ActionButton
            btnText={language === "ja" ? "送 信" : "Submit"}
            className="submitBtn"
            type="submit"
          />
        </div>

        <div className={styles.messageWrapper}>
          {(isError || isErrorWithLink || isSuccess) && (
            <FormValidationMessage
              type={isSuccess ? "success" : "error"}
              message={
                (isError
                  ? resultState?.errorMessage
                  : isErrorWithLink
                    ? resultState?.errorMessageWithResetLink
                    : resultState?.successMessage) ?? ""
              }
            />
          )}
        </div>

        {(isErrorWithLink || isSuccess) && (
          <Link
            className={styles.link}
            href={isErrorWithLink ? forgotPasswordHref : loginHref}
          >
            {isErrorWithLink
              ? language === "ja"
                ? "リンクを再発行"
                : "Request link"
              : language === "ja"
                ? "ログイン"
                : "Login"}
          </Link>
        )}
      </form>
    </>
  );
}
