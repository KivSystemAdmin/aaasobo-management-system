import type { ChangeEvent, FocusEvent, ReactNode } from "react";
import FormValidationMessage from "../formValidationMessage/FormValidationMessage";
import styles from "./TextAreaInput.module.scss";

type TextAreaInputProps = {
  id?: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLTextAreaElement>) => void;
  language?: LanguageType;
  name?: string;
  className?: string;
  maxLength?: number;
  disabled?: boolean;
  rows?: number;
  icon?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  labelTextClassName?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
  unstyled?: boolean;
  withLabelWrapper?: boolean;
};

const TextAreaInput = ({
  id,
  label,
  value,
  defaultValue,
  placeholder,
  required,
  error,
  onChange,
  onBlur,
  language = "en",
  name,
  className,
  maxLength,
  disabled,
  rows,
  icon,
  containerClassName,
  labelClassName,
  labelTextClassName,
  inputWrapperClassName,
  inputClassName,
  unstyled = false,
  withLabelWrapper = true,
}: TextAreaInputProps) => {
  const variantClassName = className ? styles[className] || className : "";
  const fieldClassName = unstyled ? containerClassName : styles.field;
  const labelStyles = unstyled ? labelClassName : styles.label;
  const labelTextStyles = unstyled ? labelTextClassName : styles.label__text;
  const wrapperStyles = unstyled ? inputWrapperClassName : styles.inputWrapper;
  const inputStyles = unstyled ? inputClassName : styles.inputField;

  const textarea = (
    <div
      className={`${wrapperStyles || ""} ${inputWrapperClassName || ""}`.trim()}
    >
      {icon && <div className={unstyled ? "" : styles.inputIcon}>{icon}</div>}
      <textarea
        id={id}
        className={`${inputStyles || ""} ${inputClassName || ""}`.trim()}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        name={name}
        maxLength={maxLength}
        disabled={disabled}
        rows={rows}
      />
    </div>
  );

  return (
    <div
      className={`${fieldClassName || ""} ${variantClassName} ${containerClassName || ""}`.trim()}
    >
      {withLabelWrapper ? (
        <label
          htmlFor={id}
          className={`${labelStyles || ""} ${labelClassName || ""}`.trim()}
        >
          {label && (
            <p
              className={`${labelTextStyles || ""} ${labelTextClassName || ""}`.trim()}
            >
              {label}
            </p>
          )}
          {textarea}
          {error && (
            <FormValidationMessage
              type="error"
              message={error}
              className="textInputError"
            />
          )}
        </label>
      ) : (
        <>
          {textarea}
          {error && (
            <FormValidationMessage
              type="error"
              message={error}
              className="textInputError"
            />
          )}
        </>
      )}
    </div>
  );
};

export default TextAreaInput;
