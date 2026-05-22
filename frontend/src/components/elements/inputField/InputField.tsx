import React from "react";
import clsx from "clsx";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import FormValidationMessage from "../formValidationMessage/FormValidationMessage";
import { Tooltip } from "../tooltip/Tooltip";
import styles from "./InputField.module.scss";

type InputFieldProps = {
  id?: string;
  label?: string;
  type?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  inputRequired?: boolean;
  required?: boolean;
  name?: string;
  error?: string;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  showPassword?: boolean;
  onTogglePasswordVisibility?: () => void;
  language?: LanguageType;
  className?: string;
  min?: string;
  display?: "block" | "inline-block" | "flex";
  readOnly?: boolean;
  maxLength?: number;
};

function InputField({
  id,
  label,
  type = "text",
  value,
  defaultValue,
  placeholder,
  onChange,
  onKeyDown,
  icon,
  inputRequired,
  required,
  name,
  error,
  minLength,
  pattern,
  autoComplete,
  showPassword = false,
  onTogglePasswordVisibility,
  language = "en",
  className,
  min,
  display = "block",
  readOnly,
  maxLength,
}: InputFieldProps) {
  const isDecorated = Boolean(label || icon || type === "password");
  const computedRequired = required ?? inputRequired ?? true;

  const inputElement = (
    <input
      id={id}
      type={showPassword ? "text" : type}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className={clsx(className, isDecorated && styles.inputField)}
      required={computedRequired}
      name={name}
      minLength={minLength}
      pattern={pattern}
      autoComplete={autoComplete}
      min={min}
      readOnly={readOnly}
      maxLength={maxLength}
    />
  );

  const content = isDecorated ? (
    <div className={styles.inputWrapper}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {inputRequired ? <span className={styles.required}>*</span> : ""}
        <div className={styles.inputContainer}>
          {icon ? <div className={styles.icon}>{icon}</div> : ""}
          {inputElement}
          {type === "password" && (
            <Tooltip
              message={
                language === "ja"
                  ? showPassword
                    ? "パスワードを非表示"
                    : "パスワードを表示"
                  : showPassword
                    ? "Click to hide"
                    : "Click to reveal"
              }
            >
              <div
                className={styles.eyeIcon}
                onClick={onTogglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeSlashIcon className={styles.eyeIconSvg} />
                ) : (
                  <EyeIcon className={styles.eyeIconSvg} />
                )}
              </div>
            </Tooltip>
          )}
        </div>
      </label>
    </div>
  ) : (
    inputElement
  );

  return (
    <div className={styles[`display__${display}`]}>
      {content}
      {error && (
        <FormValidationMessage
          type="error"
          message={error}
          className="textInputError"
        />
      )}
    </div>
  );
}

export default InputField;
