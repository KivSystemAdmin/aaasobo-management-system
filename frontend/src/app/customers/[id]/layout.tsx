"use client";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SideNav from "@/app/components/SideNav";
import styles from "./layout.module.scss";
import {
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { FC, SVGProps, useEffect, useState } from "react";
import { getCustomerById, logoutCustomer } from "@/app/helper/customersApi";
import { useRouter } from "next/navigation";

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
  const [customerName, setCustomerName] = useState<string | null>(null);
  const router = useRouter();

  const customerId = params.id;
  const links: Link[] = [
    {
      name: "Class Calendar",
      href: `/customers/${customerId}/classes`,
      icon: CalendarDaysIcon,
    },
    {
      name: "Customer Profile",
      href: `/customers/${customerId}/profile`,
      icon: UserIcon,
    },
    {
      name: "Children's Profiles",
      href: `/customers/${customerId}/children-profiles`,
      icon: UsersIcon,
    },
    {
      name: "Regular Classes",
      href: `/customers/${customerId}/regular-classes`,
      icon: ClipboardDocumentListIcon,
    },
  ];

  // TODO: Get the customer name from the session?
  useEffect(() => {
    const fetchCustomer = async () => {
      const customer = await getCustomerById(customerId);
      setCustomerName(customer.name);
    };
    fetchCustomer();
  }, []);

  const logout = async () => {
    const result = await logoutCustomer();
    if (result.ok) {
      router.push("/customers/login");
      return;
    }
    toast.error(result.error);
  };

  return (
    <div className={styles.container}>
      <ToastContainer />
      <div className={styles.sidebar}>
        {customerName && (
          <SideNav links={links} userName={customerName} logout={logout} />
        )}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
