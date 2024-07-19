"use client";

import SideNav from "@/app/components/SideNav";
import styles from "./layout.module.scss";
import { UserIcon, CalendarIcon } from "@heroicons/react/24/outline";
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
  const instructorId = params.id;
  const links: Link[] = [
    {
      name: "Class Schedule",
      href: `/instructors/${instructorId}/class-schedule`,
      icon: CalendarIcon,
    },
    {
      name: "Profile",
      href: `/instructors/${instructorId}/profile`,
      icon: UserIcon,
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
