"use client";

import EditRegularClassForm from "@/app/components/customers-dashboard/regular-classes/EditRegularClassForm";
import { getSubscriptionById } from "@/app/helper/subscriptionsApi";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./EditRegularClass.module.scss";
import { CalendarIcon, TagIcon } from "@heroicons/react/24/solid";

function EditRegularClass({
  customerId,
  isAdminAuthenticated,
}: {
  customerId: string;
  isAdminAuthenticated?: boolean;
}) {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("subscriptionId");

  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(
    null,
  );

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!subscriptionId) {
        return;
      }

      try {
        const data = await getSubscriptionById(parseInt(subscriptionId));
        setSubscriptionData(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSubscription();
  }, [subscriptionId]);

  if (!subscriptionData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h3>Regular Classes Editing Page </h3>
      <div className={styles.container}>
        <div className={styles.planContainer}>
          <div>
            <h4>Plan</h4>
            <div className={styles.planData}>
              <TagIcon className={styles.icon} />
              <p>{subscriptionData.plan.name}</p>
            </div>
          </div>
          <div>
            <h4>Number of classes a week</h4>
            <div className={styles.planData}>
              <CalendarIcon className={styles.icon} />
              <p>{subscriptionData.plan.description}</p>
            </div>
          </div>
        </div>
        <EditRegularClassForm
          customerId={customerId}
          subscriptionId={subscriptionData.id}
          isAdminAuthenticated={isAdminAuthenticated}
        />
      </div>
    </div>
  );
}

export default EditRegularClass;
