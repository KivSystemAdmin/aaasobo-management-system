"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./RegularClasses.module.scss";
import { PlusIcon } from "@heroicons/react/24/outline";
import { getSubscriptionsByCustomerId } from "@/lib/api/subscriptionsApi";
import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import CurrentSubscription from "@/components/customers-dashboard/regular-classes/CurrentSubscription";
import AddSubscription from "@/components/customers-dashboard/regular-classes/AddSubscription";
import Loading from "../../elements/loading/Loading";
import { useLanguage } from "@/contexts/LanguageContext";
import { ADD_NEW_SUBSCRIPTION } from "@/lib/messages/customerDashboard";

function RegularClasses({
  adminId,
  customerId,
  userSessionType,
}: {
  adminId?: number;
  customerId: number;
  userSessionType?: UserType;
}) {
  const { language } = useLanguage();
  const router = useRouter();
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
    setUpdateCount((count) => count + 1);
    router.refresh();
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
      {userSessionType === "admin" ? (
        <div className={styles.addBtn}>
          <ActionButton
            onClick={handleAddRegularClass}
            btnText={ADD_NEW_SUBSCRIPTION[language]}
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
        adminId={adminId}
        customerId={customerId}
        userSessionType={userSessionType}
        language={language}
        onSubscriptionUpdated={handleUpdateSubscription}
        refreshKey={updateCount}
      />
    </>
  );
}

export default RegularClasses;
