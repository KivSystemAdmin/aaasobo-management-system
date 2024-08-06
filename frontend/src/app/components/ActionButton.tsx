import React from "react";
import styles from "./RedirectButton.module.scss";

type ActionButtonProps = {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  btnText: string;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  btnText,
  disabled = false,
  className = "",
  type = "button",
  Icon,
}) => {
  if (disabled) {
    return (
      <button
        className={`${styles.btnComponent} ${className ? styles[className] : ""} ${styles.disabled}`}
        onClick={onClick}
        type={type}
      >
        <div className={styles.content}>
          <div className={styles.text}>{btnText}</div>
          {Icon && <Icon className={styles.icon} />}
        </div>
      </button>
    );
  }

  return (
    <button
      className={`${styles.btnComponent} ${className ? styles[className] : ""}`}
      onClick={onClick}
      type={type}
    >
      <div className={styles.content}>
        <div className={styles.text}>{btnText}</div>
        {Icon && <Icon className={styles.icon} />}
      </div>
    </button>
  );
};

export default ActionButton;
