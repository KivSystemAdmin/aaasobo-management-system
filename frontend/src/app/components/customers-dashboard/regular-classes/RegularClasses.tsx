"use client";

import EditButton from "@/app/components/customers-dashboard/EditButton";
import { getSubscriptionsByCustomerId } from "@/app/helper/subscriptionsApi";
import RegularClassesTable from "../../../components/customers-dashboard/regular-classes/RegularClassesTable";
import React, { useEffect, useState } from "react";

function RegularClasses({ customerId }: { customerId: string }) {
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
                <RegularClassesTable subscriptionId={subscription.id} />
                <EditButton
                  linkURL={`/customers/${customerId}/regular-classes/edit`}
                  btnText="Edit Regular Classes"
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default RegularClasses;
