"use client";

import SideNav from "@/app/components/SideNav";
import styles from "./layout.module.scss";
import { UserIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { FC, SVGProps, useEffect, useState } from "react";
import { getInstructor, logoutInstructor } from "@/app/helper/instructorsApi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { InstructorAuthentication } from "@/app/helper/authenticationUtils";
import Loading from "@/app/components/Loading";

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
  const router = useRouter();
  const instructorId = params.id;

  // Check the authentication of the instructor.
  // const { isLoading } = InstructorAuthentication(instructorId);

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
      const response = await getInstructor(parseInt(instructorId));
      if ("instructor" in response) {
        setInstructorName(response.instructor.nickname);
      } else {
        console.error(response.message);
      }
    };
    fetchInstructor();
  }, [instructorId]);

  const logout = async () => {
    const response = await logoutInstructor();
    if (!response) {
      router.push("/instructors/login");
      return;
    }
    toast.error(response.message);
  };

  // Display a loading message while checking authentication.
  // if (isLoading) {
  //   return <Loading />;
  // }

  return (
    <div className={styles.container}>
      <ToastContainer />
      <div className={styles.sidebar}>
        {instructorName && (
          <SideNav links={links} userName={instructorName} logout={logout} />
        )}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
