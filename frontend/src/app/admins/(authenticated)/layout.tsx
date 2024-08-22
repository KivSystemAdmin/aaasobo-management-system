"use client";

import { useRouter } from "next/navigation";
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
import { AuthContext } from "./authContext";
import { logoutAdmin } from "@/app/helper/adminsApi";

type Link = {
  name: string;
  href: string;
  icon: FC<SVGProps<SVGSVGElement>>;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  // Check the authentication of the admin.
  const { isAuthenticated, isLoading } = AdminAuthentication();
  const router = useRouter();

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

  const logout = async () => {
    await logoutAdmin();
    router.push("/admins/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <SideNav links={links} userName="Admin" logout={logout} />
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </AuthContext.Provider>
  );
}
