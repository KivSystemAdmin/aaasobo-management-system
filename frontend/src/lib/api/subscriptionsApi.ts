import type {
  SubscriptionsResponse,
  RegisterSubscriptionRequest,
  NewSubscriptionResponse,
} from "@shared/schemas/customers";
import { ERROR_PAGE_MESSAGE_EN } from "../messages/generalMessages";
import {
  DeleteResponse,
  UpdateSelectTypeUrlRequest,
  UpdateSubscriptionResponse,
  UpdateSubscriptionToAddClassRequest,
  UpdateSubscriptionToTerminateClassRequest,
} from "@shared/schemas/admins";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";

// GET subscriptions by a customer id
export const getSubscriptionsByCustomerId = async (
  customerId: number,
  cookie?: string,
): Promise<SubscriptionsResponse> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/customers/${customerId}/subscriptions`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/customers/${customerId}/subscriptions`;
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
    const subscriptions = await response.json();

    return subscriptions;
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    throw error;
  }
};

// Register a subscription
export const registerSubscription = async (
  customerId: number,
  subscriptionData: RegisterSubscriptionRequest,
  cookie?: string,
): Promise<NewSubscriptionResponse> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "POST";
    const body = JSON.stringify(subscriptionData);

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/customers/${customerId}/subscription`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        body,
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/customers/${customerId}/subscription`;
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to register a subscription:", error);
    throw error;
  }
};

// Cancel a subscription
export const deleteSubscription = async (
  subscriptionId: number,
  cancellationDate: string,
  cookie: string,
): Promise<DeleteResponse | { errorMessage: string }> => {
  try {
    // From server component
    const apiURL = `${BACKEND_ORIGIN}/subscriptions/${subscriptionId}`;
    const method = "DELETE";
    const body = JSON.stringify({ cancellationDate });
    const headers = { "Content-Type": "application/json", Cookie: cookie };
    const response = await fetch(apiURL, {
      method,
      headers,
      body,
    });

    if (response.status !== 200) {
      return { errorMessage: ERROR_PAGE_MESSAGE_EN };
    }
    const result: DeleteResponse = await response.json();

    return result;
  } catch (error) {
    console.error("Failed to delete the subscription:", error);
    throw error;
  }
};

export const updateSubscriptionToAddClass = async (
  subscriptionId: number,
  updateSubscriptionData: UpdateSubscriptionToAddClassRequest,
  cookie?: string,
): Promise<UpdateSubscriptionResponse | { errorMessage: string }> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "PATCH";
    const body = JSON.stringify({ updateSubscriptionData });

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/subscriptions/${subscriptionId}/increase-recurring-class`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        body,
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/classes/${subscriptionId}/status`;
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
      return { errorMessage: ERROR_PAGE_MESSAGE_EN };
    }
    const result: UpdateSubscriptionResponse = await response.json();

    return result;
  } catch (error) {
    console.error("Failed to update subscription:", error);
    throw error;
  }
};

export const updateSubscriptionToTerminateClass = async (
  subscriptionId: number,
  updateSubscriptionData: UpdateSubscriptionToTerminateClassRequest,
  cookie?: string,
): Promise<UpdateSubscriptionResponse | { errorMessage: string }> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "PATCH";
    const body = JSON.stringify({ updateSubscriptionData });

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/subscriptions/${subscriptionId}/decrease-recurring-class`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        body,
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/classes/${subscriptionId}/status`;
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
      return { errorMessage: ERROR_PAGE_MESSAGE_EN };
    }
    const result: UpdateSubscriptionResponse = await response.json();

    return result;
  } catch (error) {
    console.error("Failed to update subscription:", error);
    throw error;
  }
};

export const updateSelectTypeUrl = async (
  subscriptionId: number,
  updateSubscriptionData: UpdateSelectTypeUrlRequest,
  cookie?: string,
): Promise<UpdateSubscriptionResponse | { errorMessage: string }> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "PATCH";
    const body = JSON.stringify({ updateSubscriptionData });

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/subscriptions/${subscriptionId}/update-select-type`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        body,
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/classes/${subscriptionId}/status`;
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
      return { errorMessage: ERROR_PAGE_MESSAGE_EN };
    }
    const result: UpdateSubscriptionResponse = await response.json();

    return result;
  } catch (error) {
    console.error("Failed to update subscription:", error);
    throw error;
  }
};
