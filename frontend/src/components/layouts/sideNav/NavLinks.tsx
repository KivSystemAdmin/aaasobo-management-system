"use client";

import styles from "./SideNav.module.scss";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { getLinks } from "@/lib/data/navLinks";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NavLinks({
  userType,
}: {
  userType: "admin" | "customer" | "instructor";
}) {
  const { language } = useLanguage();
  const pathname = usePathname();
  const links = getLinks(userType, language);

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            // clsx is used for conditional rendering
            className={clsx(styles.link, {
              [styles.active]:
                pathname === link.href ||
                (pathname.startsWith(link.href) &&
                  (pathname.charAt(link.href.length) === "/" ||
                    pathname.charAt(link.href.length) === "?")),
            })}
          >
            <LinkIcon className={styles.icon} />
            <p className={styles.linkText}>{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
