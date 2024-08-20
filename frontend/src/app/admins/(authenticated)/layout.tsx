"use client";

import { createContext } from "react";
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
import { AdminAuthentication } from "@/app/helper/authenticationUtils";

type Link = {
  name: string;
  href: string;
  icon: FC<SVGProps<SVGSVGElement>>;
};

type AuthContextType = {
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({ isAuthenticated: false });

export default function Layout({ children }: { children: React.ReactNode }) {
  // Check the authentication of the admin.
  const { isAuthenticated, isLoading } = AdminAuthentication();

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

  // Display a loading message while checking authentication.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <SideNav links={links} userName="Admin" />
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </AuthContext.Provider>
  );
}

export { AuthContext };
