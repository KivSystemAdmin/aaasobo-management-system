import { GENERAL_ERROR_MESSAGE } from "../messages/formValidation";
import { holidayEventId } from "../data/data";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";

// Update business calendar schedule
export const updateBusinessSchedule = async (
  eventId: number,
  startDate: string,
  endDate: string | undefined,
  cookie: string,
): Promise<UpdateFormState> => {
  try {
    // From server component
    // Define the item to be sent to the server side.
    const apiURL = `${BACKEND_ORIGIN}/admins/business-schedule/update`;
    const method = "POST";
    const headers = { "Content-Type": "application/json", Cookie: cookie };
    const body = JSON.stringify({
      startDate,
      endDate,
      eventId,
    });

    const response = await fetch(apiURL, {
      method,
      headers,
      body,
    });

    const data = await response.json();

    if (response.status !== 200) {
      return { errorMessage: data.message };
    }

    return data;
  } catch (error) {
    console.error("API error while updating business schedule:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
};

// Update next year's all Sunday's color (Only for Vercel cron job)
export const updateSundayColor = async (
  authorization: string,
): Promise<string> => {
  try {
    // From server component
    // Define the item to be sent to the server side.
    const apiURL = `${BACKEND_ORIGIN}/jobs/business-schedule/update-sunday-color`;
    const method = "POST";
    const headers = {
      "Content-Type": "application/json",
      Authorization: authorization,
    };
    const body = JSON.stringify({
      eventId: holidayEventId,
    });
    const response = await fetch(apiURL, {
      method,
      headers,
      body,
    });

    const data = await response.json();

    if (response.status !== 200) {
      return data.error;
    }

    return data;
  } catch (error) {
    console.error("API error while updating Sunday color:", error);
    return GENERAL_ERROR_MESSAGE;
  }
};

// Delete business calendar older than 1 year (13 months to be safe) (Only for Vercel cron job)
export const deleteOldBusinessCalendar = async (authorization: string) => {
  try {
    // From server component
    const apiUrl = `${BACKEND_ORIGIN}/jobs/delete/old-business-calendar`;
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
    console.error("API error while deleting old business calendar:", error);
    throw error;
  }
};
