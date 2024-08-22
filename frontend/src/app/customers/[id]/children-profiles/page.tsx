"use client";

import ChildrenProfiles from "@/app/components/customers-dashboard/children-profiles/ChildrenProfiles";
import styles from "./page.module.scss";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return (
    <>
      <div className={styles.header}>Children&apos;s Profiles</div>
      <ChildrenProfiles customerId={customerId} />
    </>
  );
}

export default Page;
