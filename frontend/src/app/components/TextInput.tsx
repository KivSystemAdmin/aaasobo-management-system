import React, { ChangeEvent } from "react";
import styles from "./TextInput.module.scss";

type TextInputProps = {
  label: string;
  type: string;
  value: string;
  placeholder: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
};

function TextInput({
  label,
  type,
  value,
  placeholder,
  onChange,
  icon,
}: TextInputProps) {
  return (
    <div className={styles.inputWrapper}>
      <label className={styles.label}>
        {label}
        <div className={styles.inputContainer}>
          {icon ? <div className={styles.icon}>{icon}</div> : ""}
          <input
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            className={styles.inputField}
          />
        </div>
      </label>
    </div>
  );
}

export default TextInput;
