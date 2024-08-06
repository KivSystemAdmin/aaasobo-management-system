"use client";

import EditRegularClassForm from "@/app/components/customers-dashboard/regular-classes/EditRegularClassForm";
import { getSubscriptionsByCustomerId } from "@/app/helper/subscriptionsApi";
import { useEffect, useState } from "react";

function EditRegularClass({
  customerId,
  isAdminAuthenticated,
}: {
  customerId: string;
  isAdminAuthenticated?: boolean;
}) {
  const [subscriptionsData, setSubscriptionsData] =
    useState<Subscriptions | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await getSubscriptionsByCustomerId(customerId);
        setSubscriptionsData(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSubscription();
  }, [customerId]);

  return (
    <div>
      <div>
        <h1>Regular Classes Editing Page </h1>
        <h3>Regular Classes</h3>
      </div>
      {subscriptionsData &&
        subscriptionsData.subscriptions.map((subscription) => {
          const { id, plan } = subscription;
          return (
            <div key={id}>
              <div>
                <h4>&nbsp;</h4>
                <h4>Plan</h4>
                <p>
                  {plan.name} ({plan.description})
                </p>
              </div>
              <div>
                <EditRegularClassForm
                  customerId={customerId}
                  subscriptionId={subscription.id}
                  isAdminAuthenticated={isAdminAuthenticated}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default EditRegularClass;
