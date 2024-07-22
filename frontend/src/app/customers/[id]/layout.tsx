"use client";

import SideNav from "@/app/components/SideNav";
import styles from "./layout.module.scss";
import { HomeIcon, UsersIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { FC, SVGProps } from "react";

type Link = {
  name: string;
  href: string;
  icon: FC<SVGProps<SVGSVGElement>>;
};

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const customerId = params.id;
  const links: Link[] = [
    {
      name: "Home",
      href: `/customers/${customerId}/home`,
      icon: HomeIcon,
    },
    {
      name: "Children's Profiles",
      href: `/customers/${customerId}/children-profiles`,
      icon: UsersIcon,
    },
    {
      name: "Regular Classes",
      href: `/customers/${customerId}/regular-classes`,
      icon: CalendarIcon,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <SideNav links={links} />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
