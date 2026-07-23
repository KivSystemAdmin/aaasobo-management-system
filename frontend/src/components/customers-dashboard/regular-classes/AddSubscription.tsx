"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./AddSubscription.module.scss";
import { getAllPlans } from "@/lib/api/plansApi";
import { registerSubscription } from "@/lib/api/subscriptionsApi";
import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import InputField from "@/components/elements/inputField/InputField";
import { ENGLISH_BACKGROUND_LABELS } from "@/lib/data/englishBackground";
import { EnglishBackground } from "@/types";

function AddSubscription({
  customerId,
  isOpen,
  onClose,
  updateSubscription,
}: {
  customerId: number;
  isOpen: boolean;
  onClose: () => void;
  updateSubscription: () => void;
}) {
  const [isOpenForm, setIsOpenForm] = useState(isOpen);
  const [plansData, setPlansData] = useState<Plans>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectTypeValue, setSelectTypeValue] = useState<string>("");
  const [selectedEnglishBG, setSelectedEnglishBG] = useState<number | null>(
    null,
  );
  const englishBGs = [...new Set(plansData.map((p) => p.englishBackground))];
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Change the option color when selected
  const changeOptionColor = (optionTag: HTMLSelectElement) => {
    if (parseInt(optionTag.value) !== 0) {
      optionTag.style.color = "#000000";
    }
  };

  const handleEnglishBGChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value);
    setSelectedEnglishBG(value);
    setSelectedPlan(null);
    setSelectedPlanId("");
    changeOptionColor(e.target);
  };

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPlanId(id);

    const matchedPlan =
      plansData.find((plan) => plan.id === Number(id)) || null;

    setSelectedPlan(matchedPlan);
    changeOptionColor(e.target);
  };

  // Change the input color based on the date input value
  const inputStyle = selectedDate ? { color: "#000000" } : { color: "#888888" };

  // Register a subscription.
  const handleRegisterSubscription = async () => {
    if (selectedPlan === null || selectedDate === "") {
      toast.error(
        "Please select a plan and a date to register the subscription.",
      );
      return;
    }

    const subscriptionData = {
      planId: selectedPlan.id,
      startAt: selectedDate,
      selectType: selectTypeValue,
    };

    try {
      await registerSubscription(customerId, subscriptionData);
      toast.success("Subscription registered successfully.");
      updateSubscription();
      onClose();
    } catch (error) {
      console.error("Error registering subscription:", error);
      toast.error("There was an error registering the subscription.");
    }
  };

  // Reload the page to go back to the previous page.
  const handleCancellation = () => {
    setIsOpenForm(false);
    onClose();
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getAllPlans();
        setPlansData(data);
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
    };

    fetchPlans();
  }, []);

  return (
    <>
      {isOpenForm && (
        <>
          <div className={styles.container}>
            <div className={styles.filterContainer}>
              <div className={styles.formHeader}>
                <h3>Register New Subscription</h3>
                <p>
                  Enter the plan details and payment link to complete setup.
                </p>
              </div>
              <div className={styles.planDate}>
                <div className={styles.fieldGroup}>
                  <h4 className={styles.fieldLabel}>English Background</h4>
                  <select
                    value={selectedEnglishBG ?? ""}
                    onChange={handleEnglishBGChange}
                    className={styles.selectField}
                  >
                    <option disabled value="">
                      Select a category
                    </option>
                    {englishBGs.map((bg) => (
                      <option key={bg} value={bg}>
                        {ENGLISH_BACKGROUND_LABELS[bg as EnglishBackground]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <h4 className={styles.fieldLabel}>Plan</h4>
                  <select
                    value={selectedPlanId}
                    onChange={handlePlanChange}
                    className={styles.selectField}
                  >
                    <option value="">Select a plan</option>
                    {plansData
                      .filter(
                        (plan) => plan.englishBackground === selectedEnglishBG,
                      )
                      .map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ({plan.description})
                        </option>
                      ))}
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <h4 className={styles.fieldLabel}>Subscription Date</h4>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={inputStyle}
                    className={styles.dateField}
                  />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <h4 className={styles.fieldLabel}>SelectType URL</h4>
                <InputField
                  type="text"
                  name="SelectType url"
                  placeholder="https://dashboard.stripe.com/subscriptions/sub_1234567890abcdef"
                  value={selectTypeValue}
                  maxLength={50}
                  onChange={(e) => setSelectTypeValue(e.target.value)}
                  className={styles.selectTypeInput}
                />
              </div>
              <div className={styles.buttons}>
                <ActionButton
                  onClick={handleRegisterSubscription}
                  btnText="Subscribe"
                  className="addBtn"
                />
                <ActionButton
                  onClick={handleCancellation}
                  btnText="Cancel"
                  className="cancelBtn"
                />
              </div>
            </div>
          </div>
          <div className={styles.horizontalLine}></div>
        </>
      )}
    </>
  );
}

export default AddSubscription;
