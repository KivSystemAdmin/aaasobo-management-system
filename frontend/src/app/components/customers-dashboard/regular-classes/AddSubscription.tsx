"use client";

import { useState, useEffect } from "react";
import { getAllPlans } from "@/app/helper/plansApi";
import { registerSubscription } from "@/app/helper/subscriptionsApi";
import ActionButton from "@/app/components/ActionButton";

function AddSubscription({ customerId }: { customerId: string }) {
  const [plansData, setPlansData] = useState<Plans>([]);
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
      localStorage.setItem("activeTab", "2");
      window.location.reload();
    } catch (error) {
      console.error("Error registering subscription:", error);
      alert("There was an error registering the subscription.");
    }
  };

  // Reload the page to go back to the previous page.
  const handleCancellation = () => {
    localStorage.setItem("activeTab", "2");
    window.location.reload();
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
      <div>
        <h4>&nbsp;</h4>
        <h4>Plan</h4>
        <select onChange={handleSelectingPlan}>
          <option value="">-- Select a plan --</option>
          {plansData.map((plan) => {
            const { id, name, description } = plan;
            return (
              <option key={id} value={id}>
                {name} ({description})
              </option>
            );
          })}
        </select>
        <h4>Start Subscription Date</h4>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>
      <ActionButton
        onClick={handleRegisterSubscription}
        btnText="Register Subscription"
      />
      <ActionButton onClick={handleCancellation} btnText="Cancel" />
    </>
  );
}

export default AddSubscription;
