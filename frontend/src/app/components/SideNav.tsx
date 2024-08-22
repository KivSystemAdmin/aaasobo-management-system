"use client";

import styles from "./SideNav.module.scss";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { FC, SVGProps } from "react";
import { UserIcon as UserIconSolid } from "@heroicons/react/24/solid";
import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/outline";

type LinkProps = {
  name: string;
  href: string;
  icon: FC<SVGProps<SVGSVGElement>>;
};

function SideNav({
  links,
  userName,
  logout,
}: {
  links: LinkProps[];
  userName: string;
  logout: () => void;
}) {
  const pathname = usePathname();

  const [background, userType] = (() => {
    if (pathname.startsWith("/customers")) {
      return ["#009f80", "(Customer)"];
    }
    if (pathname.startsWith("/instructors")) {
      return ["#909000", "(Instructor)"];
    }
    return ["#414298", ""];
  })();

  return (
    <div className={styles.sideNavContainer}>
      <div className={styles.innerContainer}>
        <div className={styles.sideNavLogo}>
          <Image
            className={styles.sideNavLogo__img}
            src="/images/logo2.svg"
            alt="My SVG Image"
            width={183}
            height={51}
          />
        </div>

        <div className={styles.sideNavUser} style={{ background }}>
          <UserIconSolid className={styles.sideNavUser__icon} />
          <div className={styles.sideNavUser__name}>
            {userName} {userType}
          </div>
        </div>

        {links.map((link) => {
          const LinkIcon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              // clsx is used for conditional rendering
              className={clsx(styles.link, {
                [styles.active]: pathname === link.href,
              })}
            >
              <LinkIcon className={styles.icon} />
              <p className={styles.linkText}>{link.name}</p>
            </Link>
          );
        })}

        <div className={`${styles.link} ${styles.logout}`} onClick={logout}>
          <ArrowLeftStartOnRectangleIcon className={styles.icon} />
          <p className={styles.linkText}>Log Out</p>
        </div>
      </div>
    </div>
  );
}

export default SideNav;
