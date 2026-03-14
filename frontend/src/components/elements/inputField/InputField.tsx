import styles from "./InputField.module.scss";
import clsx from "clsx";
import FormValidationMessage from "../formValidationMessage/FormValidationMessage";

function InputField({
  name,
  error,
  value,
  defaultValue,
  type = "text",
  className,
  placeholder,
  min,
  display = "block",
  readOnly,
  maxLength,
  onChange,
  onKeyDown,
}: {
  name?: string;
  error?: string;
  value?: string;
  defaultValue?: string;
  type?: string;
  className?: string;
  placeholder?: string;
  min?: string; // Only applies when the input type is "date"
  display?: "block" | "inline-block" | "flex";
  readOnly?: boolean;
  maxLength?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={styles[`display__${display}`]}>
      <input
        name={name}
        className={clsx(className)}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onKeyDown={onKeyDown}
        required
        placeholder={placeholder}
        min={min}
        readOnly={readOnly}
        maxLength={maxLength}
      />
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
