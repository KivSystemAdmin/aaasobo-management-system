"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import Modal from "../elements/modal/Modal";
import styles from "./EditSubscriptionModal.module.scss";
import {
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import { getAllPlans } from "@/lib/api/plansApi";
import RegularClassesTable from "../customers-dashboard/regular-classes/RegularClassesTable";
import {
  updateSelectTypeUrlAction,
  updateSubscriptionToAddClassAction,
  updateSubscriptionToTerminateClassAction,
} from "@/app/actions/updateContent";

type EditSubscriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  subscription: Subscription | null;
  userSessionType?: UserType;
  adminId?: number;
  customerId: number;
  customerTerminationAt: string | null | undefined;
  plan?: Plan;
  language: LanguageType;
};

function EditSubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
  subscription,
  userSessionType,
  adminId,
  customerId,
  customerTerminationAt,
  plan,
  language,
}: EditSubscriptionModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedRecurringIds, setSelectedRecurringIds] = useState<number[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const currentWeeklyTimes = subscription?.plan?.weeklyClassTimes ?? 0;
  const selectedWeeklyTimes = selectedPlan?.weeklyClassTimes ?? 0;
  const [selectTypeValue, setSelectTypeValue] = useState<string>("");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansData = await getAllPlans();
        const initial =
          plansData.find((p) => p.id === subscription?.planId) ?? null;
        setPlans(plansData);
        setSelectedPlan(initial);
      } catch (e) {
        console.error("Failed to fetch plans:", e);
      }
    };
    fetchPlans();
  }, [subscription?.planId]);

  useEffect(() => {
    if (subscription) {
      setSelectTypeValue(subscription.selectType);
    }
    if (plan) {
      setSelectedPlan(plan);
    }
  }, [subscription, plan]);

  const handleSelectPlan = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedPlanId = Number(e.target.value);
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) return;
    setSelectedPlan(plan);
  };

  const toggleRecurringSelection = (id: number) => {
    setSelectedRecurringIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const resetAndClose = () => {
    setError("");
    setSelectedRecurringIds([]);
    setSelectedPlan(null);
    setLoading(false);
    setSelectTypeValue(subscription?.selectType ?? "");
    onClose();
  };

  const handleSubmit = async () => {
    if (!subscription) return;
    if (!subscription.plan.weeklyClassTimes) return;
    if (
      subscription?.planId === selectedPlan?.id &&
      subscription?.selectType === selectTypeValue
    ) {
      setError(
        "Select a different plan from the current one or change a select type URL.",
      );
      setLoading(false);
      return;
    }

    if (!selectedPlan) {
      setError("Please select a plan.");
      setLoading(false);
      return;
    }

    if (!selectTypeValue) {
      setError("Please enter a select type URL");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (currentWeeklyTimes < selectedWeeklyTimes) {
        const updateData = {
          planId: selectedPlan?.id,
          times: selectedWeeklyTimes - currentWeeklyTimes,
          selectType: selectTypeValue,
        };

        await updateSubscriptionToAddClassAction(subscription.id, updateData);
      } else if (selectedWeeklyTimes < currentWeeklyTimes) {
        if (
          subscription.plan.weeklyClassTimes - selectedWeeklyTimes !==
          selectedRecurringIds.length
        ) {
          setError(
            "Select the number of regular classes you want to terminate based on the plan you selected.",
          );
          setLoading(false);
          return;
        }

        const updateData = {
          planId: selectedPlan?.id,
          recurringClassIds: selectedRecurringIds,
          selectType: selectTypeValue,
        };

        await updateSubscriptionToTerminateClassAction(
          subscription.id,
          updateData,
        );
      } else if (currentWeeklyTimes === selectedWeeklyTimes) {
        const updateData = {
          selectType: selectTypeValue,
        };

        await updateSelectTypeUrlAction(subscription.id, updateData);
      } else {
        setError("Something went wrong. Please try again later.");
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Failed to update subscription:", error);
      setError(error.message || "Failed to update subscription");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  if (!subscription) return null;

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} overlayClosable={true}>
      <div className={styles.progressiveFlow}>
        <div className={styles.modalHeader}>
          <h2>Edit a plan</h2>
        </div>

        <div className={styles.sectionsContainer}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Select a new plan section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <AcademicCapIcon className={styles.sectionIcon} />
              <h3>Select a new Plan</h3>
            </div>
            <div className={styles.sectionContent}>
              <select
                className={styles.planInput}
                name="plan"
                defaultValue={subscription.planId}
                onChange={handleSelectPlan}
                required
              >
                {plans.map((plan) => {
                  return (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Select Type URL */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <PencilIcon className={styles.sectionIcon} />
              <h3>Change a select type URL</h3>
            </div>
            <div className={styles.sectionContent}>
              <input
                id="select type url"
                type="text"
                name="select type url"
                placeholder="https://..."
                value={selectTypeValue}
                onChange={(e) => setSelectTypeValue(e.target.value)}
                className={styles.selectTypeInput}
              />
            </div>
          </div>

          {/* Select the regular classes Section */}
          {selectedPlan && selectedWeeklyTimes < currentWeeklyTimes ? (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <ClipboardDocumentListIcon className={styles.sectionIcon} />
                <h3>Select the ones you want to terminate</h3>
              </div>
              <div className={styles.sectionContent}>
                <span className={styles.selectedValue}>
                  <div className={styles.classesContent}>
                    <RegularClassesTable
                      subscriptionId={subscription.id}
                      userSessionType={userSessionType}
                      adminId={adminId}
                      customerId={customerId}
                      customerTerminationAt={customerTerminationAt}
                      language={language}
                      isSelectable={true}
                      selectedRecurringIds={selectedRecurringIds}
                      onToggleRecurring={toggleRecurringSelection}
                    />
                  </div>
                </span>
              </div>
            </div>
          ) : (
            <></>
          )}

          {/* Action Buttons */}
          <div className={styles.confirmationActions}>
            <button onClick={resetAndClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={handleSubmit} className={styles.confirmButton}>
              {loading ? "Applying..." : "Apply Changes"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default EditSubscriptionModal;
