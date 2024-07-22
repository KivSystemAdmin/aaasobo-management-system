// GET subscriptions by a customer id
export const getSubscriptionsByCustomerId = async (customerId: string) => {
  try {
    const response = await fetch(
      `http://localhost:4000/customers/${customerId}/subscriptions`,
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
