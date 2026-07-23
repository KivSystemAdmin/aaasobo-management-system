import { DeleteResponse } from "@shared/schemas/admins";
import {
  FAILED_TO_FETCH_CHILD_PROFILES,
  FAILED_TO_FETCH_CUSTOMER_CLASSES,
  FAILED_TO_FETCH_CUSTOMER_PROFILE,
  FAILED_TO_FETCH_REBOOKABLE_CLASSES,
  FAILED_TO_FETCH_UPCOMING_CLASSES,
  FREE_TRIAL_ALREADY_REMOVED_MESSAGE,
  FREE_TRIAL_REMOVE_ERROR_MESSAGE,
  FREE_TRIAL_REMOVE_SUCCESS_MESSAGE,
  PROFILE_UPDATE_EMAIL_VERIFICATION_FAILED_MESSAGE,
  PROFILE_UPDATE_FAILED_MESSAGE,
  PROFILE_UPDATE_SUCCESS_MESSAGE,
  PROFILE_UPDATED_VERIFICATION_EMAIL_SENT,
} from "../messages/customerDashboard";
import {
  CONFIRMATION_EMAIL_SEND_FAILURE,
  EMAIL_ALREADY_REGISTERED_ERROR,
  EMAIL_AVAILABILITY_ERROR,
  EMAIL_VERIFICATION_FAILED_MESSAGE,
  EMAIL_VERIFICATION_SUCCESS_MESSAGE,
  EMAIL_VERIFICATION_TOKEN_EXPIRED,
  EMAIL_VERIFICATION_UNEXPECTED_ERROR,
  UNEXPECTED_ERROR_MESSAGE,
  GENERAL_ERROR_MESSAGE,
} from "../messages/formValidation";
import { ERROR_PAGE_MESSAGE_EN } from "../messages/generalMessages";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";

export const getCustomerById = async (
  customerId: number,
  cookie?: string,
): Promise<CustomerProfile> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/customers/${customerId}/customer`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/customers/${customerId}/customer`;
      headers = {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
        "no-cache": "no-cache",
      };
      response = await fetch(apiURL, {
        method,
        headers,
      });
    }

    if (response.status !== 200) {
      const { error } = await response.json();

      throw new Error(`HTTP Status: ${response.status} ${error}`);
    }

    const customerData = await response.json();
    return customerData;
  } catch (error) {
    console.error("Failed to fetch the customer profile:", error);
    throw new Error(FAILED_TO_FETCH_CUSTOMER_PROFILE);
  }
};

export const updateCustomerProfile = async (
  id: number,
  name: string,
  email: string,
  prefecture: string,
  cookie: string,
): Promise<LocalizedMessages> => {
  try {
    // From server component
    // Define the data to be sent to the server side.
    const apiURL = `${BACKEND_ORIGIN}/customers/${id}`;
    const method = "PATCH";
    const headers = { "Content-Type": "application/json", Cookie: cookie };
    const body = JSON.stringify({
      name,
      email,
      prefecture,
    });
    let response;

    response = await fetch(apiURL, {
      method,
      headers,
      body,
    });

    if (response.status === 409) {
      return { email: EMAIL_ALREADY_REGISTERED_ERROR };
    }

    if (response.status === 503) {
      return {
        errorMessage: PROFILE_UPDATE_EMAIL_VERIFICATION_FAILED_MESSAGE,
      };
    }

    if (response.status !== 200) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.isEmailUpdated) {
      return {
        successMessage: PROFILE_UPDATED_VERIFICATION_EMAIL_SENT,
      };
    }

    return {
      successMessage: PROFILE_UPDATE_SUCCESS_MESSAGE,
    };
  } catch (error) {
    console.error("API error while updating customer profile:", error);
    return {
      errorMessage: PROFILE_UPDATE_FAILED_MESSAGE,
    };
  }
};

// Deactivate customer and child profiles
export const deactivateCustomer = async (
  customerId: number,
  cookie: string,
): Promise<DeleteResponse | { errorMessage: string }> => {
  try {
    // From server component
    // Define the data to be sent to the server side.
    const apiURL = `${BACKEND_ORIGIN}/admins/customer-list/deactivate/${customerId}`;
    const method = "PATCH";
    const headers = { "Content-Type": "application/json", Cookie: cookie };
    const response = await fetch(apiURL, {
      method,
      headers,
    });

    if (response.status !== 200) {
      return { errorMessage: ERROR_PAGE_MESSAGE_EN };
    }
    const result: DeleteResponse = await response.json();

    return result;
  } catch (error) {
    console.error("Failed to deactivate the customer:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
};

type Response<E> =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: E;
    };

export const registerCustomer = async (
  customerData: {
    name: string;
    email: string;
    password: string;
    prefecture: string;
  },
  childData: {
    name: string;
    birthdate: string;
    personalInfo: string;
  },
  language: LanguageType,
): Promise<{
  success: boolean;
  messages?: StringMessages;
}> => {
  try {
    const apiURL = `${BACKEND_ORIGIN}/customers/register`;
    const method = "POST";
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ customerData, childData });

    const response = await fetch(apiURL, {
      method,
      headers,
      body,
    });

    if (response.status === 409) {
      return {
        success: false,
        messages: { errorMessage: EMAIL_AVAILABILITY_ERROR[language] },
      };
    }

    if (response.status === 503) {
      return {
        success: false,
        messages: { errorMessage: CONFIRMATION_EMAIL_SEND_FAILURE[language] },
      };
    }

    if (response.status !== 201) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("API error while registering customer:", error);
    return {
      success: false,
      messages: { errorMessage: UNEXPECTED_ERROR_MESSAGE[language] },
    };
  }
};

export const getRebookableClasses = async (
  customerId: number,
  cookie?: string,
): Promise<RebookableClass[] | []> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/customers/${customerId}/rebookable-classes`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/customers/${customerId}/rebookable-classes`;
      headers = {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
        "no-cache": "no-cache",
      };
      response = await fetch(apiURL, {
        method,
        headers,
      });
    }

    if (response.status !== 200) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch rebookable classes:", error);
    throw new Error(FAILED_TO_FETCH_REBOOKABLE_CLASSES);
  }
};

export const getUpcomingClasses = async (
  customerId: number,
  cookie?: string,
) => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/customers/${customerId}/upcoming-classes`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/customers/${customerId}/upcoming-classes`;
      headers = {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
        "no-cache": "no-cache",
      };
      response = await fetch(apiURL, {
        method,
        headers,
      });
    }

    if (response.status !== 200) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch upcoming classes:", error);
    throw new Error(FAILED_TO_FETCH_UPCOMING_CLASSES);
  }
};

export const getClasses = async (customerId: number, cookie?: string) => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/customers/${customerId}/classes`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/customers/${customerId}/classes`;
      headers = {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
        "no-cache": "no-cache",
      };
      response = await fetch(apiURL, {
        method,
        headers,
      });
    }

    if (response.status !== 200) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch customer classes:", error);
    throw new Error(FAILED_TO_FETCH_CUSTOMER_CLASSES);
  }
};

export const verifyCustomerEmail = async (
  token: string,
): Promise<{
  success?: { ja: string; en: string };
  error?: { ja: string; en: string };
}> => {
  try {
    const apiUrl = `${BACKEND_ORIGIN}/customers/verify-email`;
    const method = "PATCH";
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({
      token,
    });

    const statusErrorMessages: Record<number, { ja: string; en: string }> = {
      400: EMAIL_VERIFICATION_FAILED_MESSAGE,
      404: EMAIL_VERIFICATION_FAILED_MESSAGE,
      410: EMAIL_VERIFICATION_TOKEN_EXPIRED,
    };

    const response = await fetch(apiUrl, {
      method,
      headers,
      body,
    });

    const errorMessage = statusErrorMessages[response.status];
    if (errorMessage) {
      return { error: errorMessage };
    }

    if (response.status !== 200) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    return { success: EMAIL_VERIFICATION_SUCCESS_MESSAGE };
  } catch (error) {
    console.error("API error while verifying user email:", error);
    return {
      error: EMAIL_VERIFICATION_UNEXPECTED_ERROR,
    };
  }
};

export const checkEmailConflicts = async (
  email: string,
  language: LanguageType,
): Promise<{
  isValid: boolean;
  messages?: StringMessages;
}> => {
  try {
    const apiUrl = `${BACKEND_ORIGIN}/customers/check-email-conflicts`;
    const method = "POST";
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ email });
    const response = await fetch(apiUrl, {
      method,
      headers,
      body,
    });

    if (response.status === 409) {
      return {
        isValid: false,
        messages: { email: EMAIL_ALREADY_REGISTERED_ERROR[language] },
      };
    }
    return { isValid: true };
  } catch (error) {
    console.error("API error while checking email conflicts:", error);
    return {
      isValid: false,
      messages: { errorMessage: UNEXPECTED_ERROR_MESSAGE[language] },
    };
  }
};

export const getChildProfiles = async (
  customerId: number,
  cookie?: string,
): Promise<Child[]> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/customers/${customerId}/child-profiles`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/customers/${customerId}/child-profiles`;
      headers = {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
        "no-cache": "no-cache",
      };
      response = await fetch(apiURL, {
        method,
        headers,
      });
    }

    if (response.status !== 200) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    const childProfiles = await response.json();
    return childProfiles;
  } catch (error) {
    console.error("API error while fetching child profiles:", error);
    throw new Error(FAILED_TO_FETCH_CHILD_PROFILES);
  }
};

export const markWelcomeSeen = async (
  customerId: number,
  cookie?: string,
): Promise<boolean> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "PATCH";
    const body = JSON.stringify({});

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/customers/${customerId}/seen-welcome`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        body,
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/customers/${customerId}/seen-welcome`;
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
      console.error(
        `Failed to update welcome status: ${response.status} ${response.statusText}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("API error while marking welcome message as seen:", error);
    return false;
  }
};

export const declineFreeTrialClass = async (
  customerId: number,
  classCode?: string,
  cookie?: string,
): Promise<{ success: boolean; message: LocalizedMessage }> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "PATCH";
    const body = JSON.stringify({ classCode });

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/customers/${customerId}/free-trial/decline`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        body,
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/customers/${customerId}/free-trial/decline`;
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

    if (response.status === 404) {
      return { success: false, message: FREE_TRIAL_ALREADY_REMOVED_MESSAGE };
    }

    if (response.status !== 200) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    return { success: true, message: FREE_TRIAL_REMOVE_SUCCESS_MESSAGE };
  } catch (error) {
    console.error("API error while declining free trial class:", error);
    return { success: false, message: FREE_TRIAL_REMOVE_ERROR_MESSAGE };
  }
};

// Delete customers who have left the service more than 3 years ago (Only for Vercel Cron Job)
export const deletePastCustomers = async (authorization: string) => {
  try {
    // From server component
    const apiUrl = `${BACKEND_ORIGIN}/jobs/delete/past-customers`;
    const method = "DELETE";
    const headers = {
      "Content-Type": "application/json",
      Authorization: authorization,
    };
    const response = await fetch(apiUrl, {
      method,
      headers,
    });

    const data = await response.json();

    if (response.status !== 200) {
      return data.error;
    }
  } catch (error) {
    console.error("API error while deleting past customers:", error);
    throw error;
  }
};
