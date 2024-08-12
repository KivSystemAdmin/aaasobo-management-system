"use client";

import SideNav from "@/app/components/SideNav";
import styles from "./layout.module.scss";
import { UserIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { FC, SVGProps, useEffect, useState } from "react";
import { getInstructor } from "@/app/helper/instructorsApi";

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
  const [instructorName, setInstructorName] = useState<string | null>(null);

  const instructorId = parseInt(params.id);
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
    {
      name: "Availability Schedule",
      href: `/instructors/${instructorId}/availability`,
      icon: ClockIcon,
    },
  ];

  // TODO: Get the instructor name from the session?
  useEffect(() => {
    const fetchInstructor = async () => {
      const response = await getInstructor(instructorId);
      if ("instructor" in response) {
        setInstructorName(response.instructor.nickname);
      } else {
        console.error(response.message);
      }
    };
    fetchInstructor();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        {instructorName && <SideNav links={links} userName={instructorName} />}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
