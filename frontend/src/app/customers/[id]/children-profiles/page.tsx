"use client";

import ChildrenProfiles from "@/app/components/customers-dashboard/children-profiles/ChildrenProfiles";
import styles from "./page.module.scss";
import RedirectButton from "@/app/components/RedirectButton";
import { PlusIcon } from "@heroicons/react/24/outline";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return (
    <>
      <h1>Children's Profiles</h1>

      <div className={styles.addBtn}>
        <RedirectButton
          linkURL={`children-profiles/add-child`}
          btnText="Add Child"
          className="addBtn"
          Icon={PlusIcon}
        />
      </div>

      <ChildrenProfiles customerId={customerId} />
    </>
  );
}

export default Page;
