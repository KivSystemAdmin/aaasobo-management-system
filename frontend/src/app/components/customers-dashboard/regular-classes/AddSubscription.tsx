"use client";

import { useState, useEffect } from "react";
import styles from "./AddSubscription.module.scss";
import { getAllPlans } from "@/app/helper/plansApi";
import { registerSubscription } from "@/app/helper/subscriptionsApi";
import ActionButton from "@/app/components/ActionButton";

function AddSubscription({
  customerId,
  isOpen,
  onClose,
  updateSubscription,
}: {
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
  updateSubscription: () => void;
}) {
  // Set the active tab to the regular classes tab.
  localStorage.setItem("activeCustomerTab", "3");

  const [isOpenForm, setIsOpenForm] = useState(isOpen);
  const [plansData, setPlansData] = useState<Plans>([]);
  const [filterColumn, setFilterColumn] = useState<string>("0");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  useState<string>("");
  const [selectedDate, setSelectedDate] = useState("");

  // Selecting a plan from the dropdown.
  const handleSelectingPlan = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(event.target.value);
    const matchedPlan =
      plansData.find((plan) => plan.id === selectedId) || null;
    setSelectedPlan(matchedPlan);
  };

  // Change the option color when selected
  const changeOptionColor = (optionTag: HTMLSelectElement) => {
    if (parseInt(optionTag.value) !== 0) {
      optionTag.style.color = "#000000";
    }
  };

  // Handle the filter change
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    handleSelectingPlan(event);
    setFilterColumn(event.target.value);
    changeOptionColor(event.target);
  };

  // Change the input color based on the date input value
  const inputStyle = selectedDate ? { color: "#000000" } : { color: "#888888" };

  // Register a subscription.
  const handleRegisterSubscription = async () => {
    if (selectedPlan === null || selectedDate === "") {
      alert("Please select a plan and a date to register the subscription.");
      return;
    }

    const subscriptionData = {
      planId: selectedPlan.id,
      startAt: selectedDate,
    };

    try {
      await registerSubscription(customerId, subscriptionData);
      alert("Subscription registered successfully.");
      updateSubscription();
      onClose();
    } catch (error) {
      console.error("Error registering subscription:", error);
      alert("There was an error registering the subscription.");
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
              <div>
                <h4>Plan</h4>
                <select value={filterColumn} onChange={handleChange}>
                  <option disabled value="0">
                    Select a plan
                  </option>
                  {plansData.map((plan) => {
                    const { id, name, description } = plan;
                    return (
                      <option key={id} value={id}>
                        {name} ({description})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className={styles.inputContainer}>
                <h4>Subscription Date</h4>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <h4>&nbsp;</h4>
                <ActionButton
                  onClick={handleRegisterSubscription}
                  btnText="Subscribe"
                  className="addBtn"
                />
              </div>
              <div>
                <h4>&nbsp;</h4>
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
