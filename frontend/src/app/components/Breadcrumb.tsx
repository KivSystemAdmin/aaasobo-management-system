import React from "react";
import Link from "next/link";
import styles from "./Breadcrumb.module.scss";

interface BreadcrumbProps {
  links: { href?: string; label: string }[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ links }) => {
  return (
    <nav className={styles.breadcrumb}>
      <ul className={styles.breadcrumb__list}>
        {links.map((link, index) => (
          <React.Fragment key={index}>
            {link.href ? (
              <li className={styles.breadcrumb__item}>
                <Link href={link.href} passHref>
                  {link.label}
                </Link>
              </li>
            ) : (
              <li className={styles.breadcrumb__item}>{link.label}</li>
            )}
            {index < links.length - 1 && (
              <li className={styles.breadcrumb__separator}>{" >> "}</li>
            )}
          </React.Fragment>
        ))}
      </ul>
    </nav>
  );
};

export default Breadcrumb;
