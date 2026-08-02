"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import styles from "./SideNav.module.scss";
import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { logout } from "@/app/actions/authActions";

export default function LogOut({ userType }: { userType: UserType }) {
  const { language } = useLanguage();

  return (
    <form className={styles.logout} action={() => logout(userType)}>
      <button className={styles.link} type="submit">
        <ArrowLeftStartOnRectangleIcon className={styles.icon} />
        <p className={styles.linkText}>
          {userType !== "instructor" && language === "ja"
            ? "ログアウト"
            : "Log Out"}
        </p>
      </button>
    </form>
  );
}
