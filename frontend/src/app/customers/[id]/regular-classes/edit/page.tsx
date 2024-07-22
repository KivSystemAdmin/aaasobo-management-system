"use client";

import EditRegularClassForm from "@/app/components/customers-dashboard/regular-classes/EditRegularClassForm";
import { getSubscriptionsByCustomerId } from "@/app/helper/subscriptionsApi";
import { useEffect, useState } from "react";

function Page({ params }: { params: { id: string } }) {
  const [subscriptionsData, setSubscriptionsData] =
    useState<Subscriptions | null>(null);
  const customerId = params.id;

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
      </div>
      {subscriptionsData &&
        subscriptionsData.subscriptions.map((subscription) => {
          return (
            <div key={subscription.id}>
              <div>
                <h3>Regular Classes</h3>
                <h4>Plan</h4>
                <p>{subscription.plan.name}</p>
                <h4>Number of Regular Classes</h4>
                <p>{subscription.plan.description}</p>
              </div>
              <div>
                <EditRegularClassForm
                  customerId={customerId}
                  subscriptionId={subscription.id}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default Page;
