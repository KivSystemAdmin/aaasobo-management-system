const BASE_URL = "http://localhost:4000/recurring-classes";

export const addRecurringClass = async (recurringClassData: {
  instructorId: number;
  customerId: number;
  childrenIds: Array<number>;
  subscriptionId: number;
  dateTime: string;
}) => {
  try {
    const response = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recurringClassData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error. status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to add recurring class:", error);
    throw error;
  }
};

// GET recurring classes by subscription id
export const getRecurringClassesBySubscriptionId = async (
  subscriptionId: number,
) => {
  try {
    const response = await fetch(
      `${BASE_URL}?subscriptionId=${subscriptionId}`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const recurringClasses = await response.json();
    return recurringClasses;
  } catch (error) {
    console.error("Failed to fetch recurring classes:", error);
    throw error;
  }
};

// PUT a recurring class
export const editRecurringClass = async (
  recurringClassId: number,
  subscriptionId: number,
  customerId: string,
  state: RecurringClassState,
  classStartDate: string,
) => {
  // Define the data to be sent to the server side.
  const URL = `${BASE_URL}/${recurringClassId}`;
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({
    subscriptionId,
    day: state.day,
    time: state.time,
    instructorId: state.instructorId,
    customerId: Number(customerId),
    childrenIds: Array.from(state.childrenIds),
    classStartDate,
  });

  try {
    const response = await fetch(URL, {
      method: "PUT",
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to edit recurring classes:", error);
    throw error;
  }
};

// GET recurring classes by instructor id
export const getRecurringClassesByInstructorId = async (
  instructorId: number,
) => {
  try {
    const response = await fetch(
      `${BASE_URL}/by-instructorId?instructorId=${instructorId}`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.recurringClasses;
  } catch (error) {
    console.error("Failed to fetch recurring classes:", error);
    throw error;
  }
};
