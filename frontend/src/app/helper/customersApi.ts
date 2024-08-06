export const getCustomerById = async (customerId: string) => {
  try {
    const response = await fetch(
      `http://localhost:4000/customers/${customerId}/customer`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.customer;
  } catch (error) {
    console.error("Failed to fetch customer data:", error);
    throw error;
  }
};

// PATCH customer data
export const editCustomer = async (
  customerId: string,
  customerName: string,
  customerEmail: string,
  customerPrefecture: string,
) => {
  // Define the data to be sent to the server side.
  const customerURL = `http://localhost:4000/customers/${customerId}`;
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({
    name: customerName,
    email: customerEmail,
    prefecture: customerPrefecture,
  });

  const response = await fetch(customerURL, {
    method: "PATCH",
    headers,
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return data;
};
