"use client";

import SideNav from "@/app/components/SideNav";
import styles from "./layout.module.scss";
import {
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { FC, SVGProps, useEffect, useState } from "react";
import { getCustomerById } from "@/app/helper/customersApi";

type Link = {
  name: string;
  href: string;
  icon: FC<SVGProps<SVGSVGElement>>;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const links: Link[] = [
    {
      name: "Class Calendar",
      href: "/admins/calendar",
      icon: CalendarDaysIcon,
    },
    {
      name: "Instructor List",
      href: "/admins/instructor-list",
      icon: ClipboardDocumentListIcon,
    },
    {
      name: "Customer List",
      href: "/admins/customer-list",
      icon: UsersIcon,
    },
    {
      name: "Child List",
      href: "/admins/child-list",
      icon: UserGroupIcon,
    },
  ];

  // TODO: Get the admin name from the session?

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <SideNav links={links} userName="admin" />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
