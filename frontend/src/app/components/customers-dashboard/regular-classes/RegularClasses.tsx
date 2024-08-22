"use client";

import { useEffect, useState } from "react";
import styles from "./RegularClasses.module.scss";
import { PlusIcon } from "@heroicons/react/24/outline";
import { getSubscriptionsByCustomerId } from "@/app/helper/subscriptionsApi";
import ActionButton from "@/app/components/ActionButton";
import CurrentSubscription from "@/app/components/customers-dashboard/regular-classes/CurrentSubscription";
import AddSubscription from "@/app/components/customers-dashboard/regular-classes/AddSubscription";
import Loading from "../../Loading";

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
  const [updateCount, setUpdateCount] = useState(0);

  const handleAddRegularClass = () => {
    setShowAddPlan(true);
  };

  const handleCloseForm = () => {
    setShowAddPlan(false);
  };

  const handleUpdateSubscription = () => {
    setUpdateCount(updateCount + 1);
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
  }, [customerId, updateCount]);

  if (!subscriptionsData) {
    return <Loading />;
  }

  return (
    <>
      {isAdminAuthenticated ? (
        <div className={styles.addBtn}>
          <ActionButton
            onClick={handleAddRegularClass}
            btnText="Add New Subscription"
            className="addBtn"
            Icon={PlusIcon}
          />
        </div>
      ) : null}
      {showAddPlan && (
        <AddSubscription
          customerId={customerId}
          isOpen={true}
          onClose={handleCloseForm}
          updateSubscription={handleUpdateSubscription}
        />
      )}
      <CurrentSubscription
        subscriptionsData={subscriptionsData}
        customerId={customerId}
        isAdminAuthenticated={isAdminAuthenticated}
      />
    </>
  );
}

export default RegularClasses;
