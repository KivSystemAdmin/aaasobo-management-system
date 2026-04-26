"use client";

import RegularClasses from "@/components/customers-dashboard/regular-classes/RegularClasses";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./page.module.scss";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RegularClassesPageClient({
  customerId,
}: {
  customerId: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const toastDisplayed = useRef(false);

  useEffect(() => {
    if (toastDisplayed.current || !paramsKey) return;

    const urlParams = new URLSearchParams(paramsKey);
    const successMessage = urlParams.get("successMessage");
    if (successMessage) {
      toast.success(successMessage);
    }

    const warningMessage = urlParams.get("warningMessage");
    if (warningMessage) {
      toast.warning(warningMessage);
    }

    if (!successMessage && !warningMessage) return;

    toastDisplayed.current = true;
    router.replace(window.location.pathname);
  }, [paramsKey, router]);

  return (
    <div>
      <div className={styles.header}>Regular Classes</div>
      <RegularClasses customerId={customerId} />
    </div>
  );
}
