"use client";

import { useState } from "react";
import Image from "next/image";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import styles from "./layout.module.scss";

export default function InstructorLayout({
  sideNav,
  children,
}: {
  sideNav: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className={styles.container}>
      <header className={styles.mobileHeader}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-controls="instructor-sidebar"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? (
            <XMarkIcon className={styles.menuIcon} />
          ) : (
            <Bars3Icon className={styles.menuIcon} />
          )}
        </button>
        <Image
          src="/images/logo2.svg"
          alt="Aaasobo logo"
          width={120}
          height={34}
        />
      </header>
      <div
        id="instructor-sidebar"
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      >
        {sideNav}
      </div>
      {isOpen ? (
        <button
          type="button"
          className={styles.overlay}
          onClick={closeMenu}
          aria-label="Close menu"
        />
      ) : null}
      <div className={styles.content} onClick={closeMenu}>
        {children}
      </div>
    </div>
  );
}
