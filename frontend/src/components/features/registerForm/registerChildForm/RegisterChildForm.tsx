"use client";

import styles from "./RegisterChildForm.module.scss";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import InputField from "@/components/elements/inputField/InputField";
import { useCallback, useState } from "react";
import BirthdateInput from "../birthdateInput/BirthdateInput";
import FormValidationMessage from "@/components/elements/formValidationMessage/FormValidationMessage";
import { extractRegisterValidationErrors } from "@/lib/utils/validationErrorUtils";
import { registerCustomer } from "@/lib/api/customersApi";
import { createChildRegisterSchema } from "@/schemas/authSchema";
import { useFormFieldSetter } from "@/hooks/useFormFieldSetter";
import TextAreaInput from "@/components/elements/textAreaInput/TextAreaInput";

export default function RegisterChildForm({
  customerData,
  childData,
  setChildData,
  onPreviousStep,
  onNextStep,
  language,
}: RegisterChildProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [localMessages, setLocalMessages] = useState<StringMessages>({});

  const clearErrorMessage = useCallback((field: string) => {
    setLocalMessages((prev) => {
      if (field === "all") {
        return {};
      }
      const updatedMessages = { ...prev };
      delete updatedMessages[field];
      delete updatedMessages.errorMessage;
      return updatedMessages;
    });
  }, []);

  const handleChange = useFormFieldSetter(setChildData);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const schema = createChildRegisterSchema(language);

    setIsLoading(true);

    const parsedForm = schema.safeParse({
      name: childData.name,
      birthdate: childData.birthdate,
      personalInfo: childData.personalInfo,
    });

    if (!parsedForm.success) {
      const validationErrors = parsedForm.error.issues;
      const errors = extractRegisterValidationErrors(
        validationErrors,
        language,
      );
      setIsLoading(false);
      return setLocalMessages(errors);
    }

    const { isAgreed, ...customerDataToRegister } = customerData;

    const result = await registerCustomer(
      customerDataToRegister,
      childData,
      language,
    );

    if (!result.success) {
      setIsLoading(false);
      return setLocalMessages(result.messages ?? {});
    }

    onNextStep();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <InputField
        id="name"
        type="text"
        defaultValue={childData.name}
        required
        placeholder={
          language === "ja"
            ? "お子さまのお名前(ローマ字で)"
            : "Child's name (in English)"
        }
        icon={<UserCircleIcon className={styles.icon} />}
        error={localMessages.name}
        onChange={(e) => {
          handleChange("name", e.target.value);
          clearErrorMessage("name");
        }}
      />

      <div className={styles.birthdate}>
        <p className={styles.birthdate__label}>
          {language === "ja"
            ? "お子さまの生年月日(半角数字)"
            : "Child's date of birth"}
        </p>
        <BirthdateInput
          onValidDateChange={useCallback(
            (date?: string | null) => {
              if (date) handleChange("birthdate", date);
              clearErrorMessage("birthdate");
            },
            [handleChange, clearErrorMessage],
          )}
          defaultBirthdate={childData.birthdate}
          error={localMessages.birthdate}
          language={language}
        />
      </div>

      <TextAreaInput
        id="personalInfo"
        label={
          language === "ja"
            ? "お子さまの年齢・英語レベル・好きなことや食べ物をお教えください(できましたら英語で。日本語も可)"
            : "Tell us your child's age, English level, and likes (English preferred, Japanese OK)."
        }
        defaultValue={childData.personalInfo}
        placeholder={
          language === "ja"
            ? "例. 5 years old, Beginner, Car, Peppapig"
            : "e.g., 5 years old, Beginner, Car, Peppapig"
        }
        error={localMessages.personalInfo}
        onChange={(e) => {
          handleChange("personalInfo", e.target.value);
          clearErrorMessage("personalInfo");
        }}
        required
        language={language}
      />

      <div className={styles.messageWrapper}>
        {localMessages.errorMessage && (
          <FormValidationMessage
            type="error"
            message={localMessages.errorMessage}
          />
        )}
      </div>

      <div className={styles.buttonsWrapper}>
        <ActionButton
          btnText={language === "ja" ? "戻る" : "Back"}
          className="backBtn"
          type="button"
          onClick={onPreviousStep}
          disabled={isLoading}
        />
        <ActionButton
          btnText={language === "ja" ? "アカウント登録" : "Create Account"}
          className="bookBtn"
          type="submit"
          disabled={isLoading}
        />
      </div>
    </form>
  );
}
