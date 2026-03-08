"use client";

import RegularClassesTable from "@/components/customers-dashboard/regular-classes/RegularClassesTable";
import styles from "./CurrentSubscription.module.scss";
import {
  PLAN_LABEL,
  PRESENT_LABEL,
  NO_SUBSCRIPTION_MESSAGE,
} from "@/lib/messages/customerDashboard";
import ActionButton from "../../elements/buttons/actionButton/ActionButton";
import { deleteSubscriptionAction } from "@/app/actions/deleteContent";
import { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "@/lib/utils/alertUtils";
import EditSubscriptionModal from "../../admins-dashboard/EditSubscriptionModal";

function CurrentSubscription({
  subscriptionsData,
  userSessionType,
  adminId,
  customerId,
  language,
  onSubscriptionUpdated,
  refreshKey,
}: {
  subscriptionsData?: Subscriptions | null;
  userSessionType?: UserType;
  adminId?: number;
  customerId: number;
  language: LanguageType;
  onSubscriptionUpdated: () => void;
  refreshKey?: number;
}) {
  const [deleteResultState, setDeleteResultState] = useState<DeleteFormState>(
    {},
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

  const handleDeleteSubscription = async (id: number) => {
    const confirmed = await confirmAlert(
      "Are you sure you want to delete this subscription?",
    );

    if (!confirmed) return;

    // prevent duplicate clicks
    if (deletingId !== null) return;

    try {
      setDeletingId(id);
      const result = await deleteSubscriptionAction(id);
      setDeleteResultState(result);

      const success = result && !result.errorMessage;

      if (success) {
        toast.success("Subscription deleted successfully.");
        onSubscriptionUpdated();
      } else {
        toast.error("Failed to delete subscription.");
        console.error("Failed to delete subscription:", result);
      }
    } catch (error) {
      console.error("Error deleting subscription:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSubscription = (id: number) => {
    const subscription = subscriptionsData?.subscriptions.find(
      (s) => s.id === id,
    );
    if (!subscription) return;
    setSelectedSubscription(subscription);
    setIsOpenModal(true);
  };

  const handleCloseModal = () => {
    setIsOpenModal(false);
  };

  const handleEditSuccess = () => {
    onSubscriptionUpdated();
    setIsOpenModal(false);
    toast.success("Subscription updated successfully.");
  };

  return (
    <div className={styles.outsideContainer}>
      {subscriptionsData && subscriptionsData.subscriptions.length > 0 ? (
        subscriptionsData.subscriptions.map((subscription, index) => {
          const { id, plan, startAt, customerTerminationAt, selectType } =
            subscription;
          const startDate = new Date(startAt);

          return (
            <div key={id} className={styles.subscriptionSection}>
              <div className={styles.enhancedHeader}>
                <div className={styles.headerContent}>
                  <div className={styles.planDateInfo}>
                    <div className={styles.planInfo}>
                      <span className={styles.planName}>
                        {plan.name} {PLAN_LABEL[language]}
                      </span>
                    </div>
                    <div className={styles.dateInfo}>
                      <span className={styles.dateText}>
                        {language === "ja"
                          ? startDate.toLocaleDateString("ja-JP", {
                              year: "numeric",
                              month: "long",
                            })
                          : startDate.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                            })}{" "}
                        - {PRESENT_LABEL[language]}
                      </span>
                    </div>

                    {userSessionType === "admin" ? (
                      <div>
                        <a
                          href={subscription.selectType}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.dateText}
                        >
                          {subscription.selectType}
                        </a>
                      </div>
                    ) : (
                      <></>
                    )}
                  </div>

                  {userSessionType === "admin" &&
                  subscription.endAt === null ? (
                    <div className={styles.buttons}>
                      <ActionButton
                        onClick={() => handleEditSubscription(id)}
                        btnText={"Edit"}
                        className="editBtn"
                      />
                      <ActionButton
                        onClick={() => handleDeleteSubscription(id)}
                        btnText={deletingId === id ? "DELETING..." : "Delete"}
                        className="deleteBtn"
                        disabled={deletingId === id}
                      />
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
              <div className={styles.classesContent}>
                <RegularClassesTable
                  subscriptionId={id}
                  userSessionType={userSessionType}
                  adminId={adminId}
                  customerId={customerId}
                  customerTerminationAt={customerTerminationAt}
                  language={language}
                  plan={plan}
                  refreshKey={refreshKey}
                />
              </div>

              {/* Add spacing between multiple subscriptions */}
              {index < subscriptionsData.subscriptions.length - 1 && (
                <div className={styles.subscriptionDivider}></div>
              )}
            </div>
          );
        })
      ) : (
        <p>{NO_SUBSCRIPTION_MESSAGE[language]}</p>
      )}

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal
        isOpen={isOpenModal}
        onClose={handleCloseModal}
        onSuccess={handleEditSuccess}
        subscription={selectedSubscription}
        userSessionType={userSessionType}
        adminId={adminId}
        customerId={customerId}
        customerTerminationAt={selectedSubscription?.customerTerminationAt}
        plan={selectedSubscription?.plan}
        language={language}
      />
    </div>
  );
}

export default CurrentSubscription;
