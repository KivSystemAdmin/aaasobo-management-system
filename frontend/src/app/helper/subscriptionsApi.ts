const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";

// GET subscriptions by a customer id
export const getSubscriptionsByCustomerId = async (customerId: string) => {
  try {
    const response = await fetch(
      `${BACKEND_ORIGIN}/customers/${customerId}/subscriptions`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const subscriptions = await response.json();

    return subscriptions;
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    throw error;
  }
};

// Register a subscription
export const registerSubscription = async (
  customerId: string,
  subscriptionData: RegisterSubscription,
) => {
  try {
    const response = await fetch(
      `${BACKEND_ORIGIN}/customers/${customerId}/subscription`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscriptionData),
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return;
  } catch (error) {
    console.error("Failed to register a subscription:", error);
    throw error;
  }
};

// GET subscription by a subscription id
export const getSubscriptionById = async (subscriptionId: number) => {
  try {
    const response = await fetch(
      `${BACKEND_ORIGIN}/subscriptions/${subscriptionId}`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const subscription = await response.json();

    return subscription;
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    throw error;
  }
};
