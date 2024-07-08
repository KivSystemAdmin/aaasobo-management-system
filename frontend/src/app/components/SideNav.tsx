"use client";

import styles from "./SideNav.module.scss";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { FC, SVGProps } from "react";

type LinkProps = {
  name: string;
  href: string;
  icon: FC<SVGProps<SVGSVGElement>>;
};

function SideNav({ links }: { links: LinkProps[] }) {
  const pathname = usePathname();

  return (
    <div className={styles.sideNavContainer}>
      <div className={styles.innerContainer}>
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
      </div>
    </div>
  );
}

export default SideNav;
