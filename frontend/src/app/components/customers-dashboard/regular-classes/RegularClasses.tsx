"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSubscriptionsByCustomerId } from "@/app/helper/subscriptionsApi";
import ActionButton from "@/app/components/ActionButton";
import CurrentSubscription from "@/app/components/customers-dashboard/regular-classes/CurrentSubscription";
import AddSubscription from "@/app/components/customers-dashboard/regular-classes/AddSubscription";

function RegularClasses({
  customerId,
  isAdminAuthenticated,
}: {
  customerId: string;
  isAdminAuthenticated?: boolean;
}) {
  const [subscriptionsData, setSubscriptionsData] =
    useState<Subscriptions | null>(null);
  const [showAddPlan, setShowAddPlan] = useState(false);

  const handleAddRegularClass = () => {
    setShowAddPlan(true);
  };
  const router = useRouter();

  const handleEditRegularClasses = () => {
    if (isAdminAuthenticated) {
      router.push(`/admins/customer-list/${customerId}/regular-classes/edit`);
      return;
    }
    router.push(`/customers/${customerId}/regular-classes/edit`);
  };

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
    <>
      <h3>Regular Classes</h3>
      {isAdminAuthenticated ? (
        <ActionButton
          onClick={handleAddRegularClass}
          btnText="Add Subscription"
        />
      ) : null}
      <ActionButton
        onClick={handleEditRegularClasses}
        btnText="Edit Regular Classes"
      />
      <CurrentSubscription subscriptionsData={subscriptionsData} />
      {showAddPlan && <AddSubscription customerId={customerId} />}
    </>
  );
}

export default RegularClasses;
