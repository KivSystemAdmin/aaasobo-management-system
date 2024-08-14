"use client";

import RegularClassesTable from "@/app/components/customers-dashboard/regular-classes/RegularClassesTable";
import styles from "./CurrentSubscription.module.scss";
import { CalendarIcon, TagIcon } from "@heroicons/react/24/solid";

function CurrentSubscription({
  subscriptionsData,
  isAdminAuthenticated,
  customerId,
}: {
  subscriptionsData?: Subscriptions | null;
  isAdminAuthenticated?: boolean | null;
  customerId: string;
}) {
  return (
    <div className={styles.outsideContainer}>
      {subscriptionsData
        ? subscriptionsData.subscriptions.map((subscription) => {
            const { id, plan } = subscription;
            return (
              <div key={id} className={styles.container}>
                <div className={styles.planContainer}>
                  <div>
                    <h4>Plan</h4>
                    <div className={styles.planData}>
                      <TagIcon className={styles.icon} />
                      <p>{plan.name}</p>
                    </div>
                  </div>
                  <div>
                    <h4>Number of classes a week</h4>
                    <div className={styles.planData}>
                      <CalendarIcon className={styles.icon} />
                      <p>{plan.description}</p>
                    </div>
                  </div>
                </div>
                <RegularClassesTable
                  subscriptionId={id}
                  isAdminAuthenticated={isAdminAuthenticated}
                  customerId={customerId}
                />
              </div>
            );
          })
        : null}
    </div>
  );
}

export default CurrentSubscription;
