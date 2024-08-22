"use client";

import AddChildForm from "@/app/components/customers-dashboard/children-profiles/AddChildForm";
import styles from "./page.module.scss";
import Link from "next/link";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return (
    <>
      <div>
        <nav className={styles.breadcrumb}>
          <ul className={styles.breadcrumb__list}>
            <li className={styles.breadcrumb__item}>
              <Link
                href={`/customers/${customerId}/children-profiles`}
                passHref
              >
                Children&apos;s Profiles
              </Link>
            </li>
            <li className={styles.breadcrumb__separator}>{" >> "}</li>
            <li className={styles.breadcrumb__item}>Add Child</li>
          </ul>
        </nav>
      </div>
      <AddChildForm customerId={customerId} />
    </>
  );
}

export default Page;
