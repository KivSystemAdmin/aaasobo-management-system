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
      <span
        className={`${styles.link} ${className ? styles[className] : ""} ${styles.disabled}`}
      >
        <span className={styles.text}>{btnText}</span>
        {Icon && <Icon className={styles.icon} />}
      </span>
    );
  }

  return (
    <Link
      href={linkURL}
      className={`${styles.link} ${className ? styles[className] : ""}`}
    >
      <span className={styles.text}>{btnText}</span>
      {Icon && <Icon className={styles.icon} />}
    </Link>
  );
};

export default RedirectButton;
