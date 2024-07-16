"use client";

import AddRegularClassForm from "@/app/components/customers-dashboard/regular-classes/AddRegularClassForm";
import { useState } from "react";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;
  const [subscription, setSubscription] = useState({ id: 1 });

  // TODO: GET the subscription and set the data

  return (
    <div>
      <div>
        <h1>Add Regular Class</h1>
      </div>
      <AddRegularClassForm
        customerId={customerId}
        subscriptionId={subscription.id}
      />
    </div>
  );
}

export default Page;
