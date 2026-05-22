import { ChangeEvent } from "react";
import styles from "./RadioButton.module.scss";

export default function RadioButton({
  name,
  value,
  checked,
  onChange,
  label,
  className,
}: {
  name: string;
  value: string | number;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  className?: string;
}) {
  return (
    <label className={`${styles.radioLabel} ${className ?? ""}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
