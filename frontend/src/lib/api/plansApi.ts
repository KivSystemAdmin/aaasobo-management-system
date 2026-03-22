import {
  ITEM_REQUIRED_ERROR,
  GENERAL_ERROR_MESSAGE,
  CONTENT_REGISTRATION_SUCCESS_MESSAGE,
} from "../messages/formValidation";
import type { PlanResponse, PlansListResponse } from "@shared/schemas/plans";
import { EnglishBackground } from "@/types";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";

const BASE_URL = `${BACKEND_ORIGIN}/plans`;

type Response<T> = T | { message: string };

// GET all plans data
export const getAllPlans = async (
  cookie?: string,
): Promise<PlansListResponse["data"]> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/plans`;
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { data }: PlansListResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    throw error;
  }
};

// Get plan by ID
export const getPlanById = async (
  id: number,
  cookie?: string,
): Promise<Response<PlanResponse>> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/${id}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/plans/${id}`;
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

    const data: Response<PlanResponse> = await response.json();

    return data;
  } catch (error) {
    console.error("Failed to fetch plan by ID:", error);
    return { message: GENERAL_ERROR_MESSAGE };
  }
};

// Register a new plan
export const registerPlan = async (userData: {
  planNameEng: string;
  planNameJpn: string;
  weeklyClassTimes: number;
  description: string;
  englishBackground: EnglishBackground;
  cookie: string;
}): Promise<RegisterFormState> => {
  try {
    // From server component
    // Define the item to be sent to the server side.
    const apiURL = `${BACKEND_ORIGIN}/admins/plan-list/register`;
    const method = "POST";
    const headers = {
      "Content-Type": "application/json",
      Cookie: userData.cookie,
    };
    const body = JSON.stringify(userData);
    const response = await fetch(apiURL, {
      method,
      headers,
      body,
    });

    if (response.status !== 201) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    return {
      successMessage: CONTENT_REGISTRATION_SUCCESS_MESSAGE("plan"),
    };
  } catch (error) {
    console.error("API error while registering plan:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
};

// Update plan information
export const updatePlan = async (
  planId: number,
  planNameEng: string | null,
  planNameJpn: string | null,
  planDescription: string | null,
  englishBackground: EnglishBackground,
  cookie: string,
): Promise<UpdateFormState> => {
  try {
    // From server component
    // Define the item to be sent to the server side.
    const apiURL = `${BACKEND_ORIGIN}/admins/plan-list/update/${planId}`;
    const method = "PATCH";
    const headers = { "Content-Type": "application/json", Cookie: cookie };
    const body = JSON.stringify({
      planNameEng,
      planNameJpn,
      description: planDescription,
      englishBackground,
    });

    const response = await fetch(apiURL, {
      method,
      headers,
      body,
    });

    const data = await response.json();

    // Display the required error if the response status is 400
    if (response.status === 400) {
      return { name: ITEM_REQUIRED_ERROR("plan name") };
    }

    if (response.status !== 200) {
      return { errorMessage: data.message };
    }

    return data;
  } catch (error) {
    console.error("API error while updating plan:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
};

// DELETE plan data
export const deletePlan = async (planId: number, cookie: string) => {
  try {
    // From server component
    // Define the data to be sent to the server side.
    const apiURL = `${BACKEND_ORIGIN}/admins/plan-list/delete/${planId}`;
    const method = "DELETE";
    const headers = { "Content-Type": "application/json", Cookie: cookie };
    const response = await fetch(apiURL, {
      method,
      headers,
    });

    if (response.status !== 200) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();

    return result;
  } catch (error) {
    console.error("Failed to delete the plan:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
};

// Delete plans that are no longer necessary
export const deleteUnnecessaryPlans = async (authorization: string) => {
  try {
    // From server component
    const apiUrl = `${BACKEND_ORIGIN}/jobs/delete/unnecessary-plans`;
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
    console.error("API error while deleting unnecessary plans:", error);
    throw error;
  }
};
