import React from "react";
import Link from "next/link";
import styles from "./RedirectButton.module.scss";

type RedirectButtonProps = {
  linkURL: string;
  btnText: string;
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  disabled?: boolean;
  className?: string;
};

const RedirectButton: React.FC<RedirectButtonProps> = ({
  linkURL,
  btnText,
  Icon,
  disabled = false,
  className = "",
}) => {
  if (disabled) {
    return (
      <div
        className={`${styles.btnComponent} ${className ? styles[className] : ""} ${styles.disabled}`}
      >
        <div className={styles.content}>
          <div className={styles.text}>{btnText}</div>
          {Icon && <Icon className={styles.icon} />}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={linkURL}
      className={`${styles.btnComponent} ${className ? styles[className] : ""}`}
    >
      <div className={styles.content}>
        <div className={styles.text}>{btnText}</div>
        {Icon && <Icon className={styles.icon} />}
      </div>
    </Link>
  );
};

export default RedirectButton;
