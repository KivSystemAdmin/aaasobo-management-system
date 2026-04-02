import type { UpdateRecurringClassRequest } from "@shared/schemas/recurringClasses";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";
const BASE_URL = `${BACKEND_ORIGIN}/recurring-classes`;

// GET recurring classes by subscription id
export const getRecurringClassesBySubscriptionId = async (
  subscriptionId: number,
  status?: "active" | "history",
  cookie?: string,
): Promise<RecurringClasses> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";
    const params = new URLSearchParams({
      subscriptionId: subscriptionId.toString(),
    });
    if (status) {
      params.append("status", status);
    }

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}?${params.toString()}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/recurring-classes?${params.toString()}`;
      headers = {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
      };
      response = await fetch(apiURL, {
        method,
        headers,
      });
    }

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const recurringClasses = await response.json();
    return recurringClasses;
  } catch (error) {
    console.error("Failed to fetch recurring classes:", error);
    throw error;
  }
};

export const getRecurringClassesHistoryCountBySubscriptionId = async (
  subscriptionId: number,
  cookie?: string,
): Promise<number> => {
  const params = new URLSearchParams({
    subscriptionId: subscriptionId.toString(),
  });
  let apiURL;
  let headers;
  let response;
  const method = "GET";

  if (cookie) {
    // From server component
    apiURL = `${BASE_URL}/history-count?${params.toString()}`;
    headers = { "Content-Type": "application/json", Cookie: cookie };
    response = await fetch(apiURL, {
      method,
      headers,
    });
  } else {
    // From client component (via proxy)
    apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
    const backendEndpoint = `/recurring-classes/history-count?${params.toString()}`;
    headers = {
      "Content-Type": "application/json",
      "backend-endpoint": backendEndpoint,
    };
    response = await fetch(apiURL, {
      method,
      headers,
    });
  }

  if (response.status !== 200) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();

  return data.count;
};

export const editRecurringClass = async (
  recurringClassId: number,
  recurringClassData: UpdateRecurringClassRequest,
  cookie?: string,
): Promise<{
  message: string;
  oldRecurringClass: RecurringClass;
  newRecurringClass: RecurringClass;
}> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "PUT";
    const body = JSON.stringify(recurringClassData);

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/${recurringClassId}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        body,
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/recurring-classes/${recurringClassId}`;
      headers = {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
      };
      response = await fetch(apiURL, {
        method,
        headers,
        body,
      });
    }

    if (response.status !== 200) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ||
          errorData.error ||
          "Failed to edit recurring class",
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to edit recurring class:", error);
    throw error;
  }
};
