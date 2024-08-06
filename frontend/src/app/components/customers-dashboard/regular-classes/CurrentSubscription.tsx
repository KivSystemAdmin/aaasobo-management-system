"use client";

import RegularClassesTable from "@/app/components/customers-dashboard/regular-classes/RegularClassesTable";

function CurrentSubscription({
  subscriptionsData,
}: {
  subscriptionsData?: Subscriptions | null;
}) {
  return (
    <>
      {subscriptionsData
        ? subscriptionsData.subscriptions.map((subscription) => {
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
                <RegularClassesTable subscriptionId={id} />
              </div>
            );
          })
        : null}
    </>
  );
}

export default CurrentSubscription;
