import { FAILED_TO_FETCH_INSTRUCTOR_PROFILES } from "../messages/customerDashboard";
import {
  INSTRUCTOR_REGISTRATION_SUCCESS_MESSAGE,
  GENERAL_ERROR_MESSAGE,
  SINGLE_ITEM_ALREADY_REGISTERED_ERROR,
  MULTIPLE_ITEMS_ALREADY_REGISTERED_ERROR,
} from "../messages/formValidation";
import { ERROR_PAGE_MESSAGE_EN } from "../messages/generalMessages";
import {
  FAILED_TO_FETCH_INSTRUCTOR_AVAILABILITIES,
  FAILED_TO_FETCH_INSTRUCTOR_CLASSES,
  FAILED_TO_FETCH_INSTRUCTOR_PROFILE,
} from "../messages/instructorDashboard";
import type {
  InstructorProfile,
  CompleteInstructor,
  DetailedInstructorProfile,
  InstructorSchedule,
  AvailableSlot,
  SimpleInstructorProfile,
  CreateScheduleRequest,
  ActiveInstructorSchedule,
  ScheduleUpdateImpactSummary,
  AvailableSlotsQuery,
  AvailableSlotsResponse,
  InstructorAbsence,
  InstructorAbsencesResponse,
  CreateAbsenceResponse,
  DeleteAbsenceResponse,
  InstructorTagsResponse,
  TagCatalogResponse,
  UpdateInstructorTagsRequest,
} from "@shared/schemas/instructors";
import { EnglishBackground } from "@/types";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";
const BASE_URL = `${BACKEND_ORIGIN}/instructors`;

type Response<T> = T | { message: string };

export type InstructorSlot = {
  scheduleId: number;
  weekday: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "HH:MM" format
};

export type InstructorScheduleWithSlots = InstructorSchedule & {
  slots: InstructorSlot[];
};

// GET instructors data
export const getInstructors = async (cookie?: string) => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/admins/instructor-list`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
      });
    } else {
      // From client component (via proxy)
      const backendEndpoint = `/admins/instructor-list`;
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
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
    const result = await response.json();
    return result.data.map(
      (instructor: { ID: number; Instructor: string }) => ({
        id: instructor.ID,
        name: instructor.Instructor,
      }),
    );
  } catch (error) {
    console.error("Failed to fetch instructors:", error);
    throw error;
  }
};

export const getInstructor = async (id: number, cookie?: string) => {
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
      const backendEndpoint = `/instructors/${id}`;
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
    const data: Response<{ instructor: CompleteInstructor }> =
      await response.json();

    return data;
  } catch (error) {
    console.error("Failed to fetch instructor:", error);
    throw error;
  }
};

// GET instructor id by class id
export const getInstructorIdByClassId = async (
  classId: number,
  cookie?: string,
) => {
  let apiURL;
  let headers;
  let response;
  const method = "GET";

  if (cookie) {
    // From server component
    apiURL = `${BASE_URL}/class/${classId}`;
    headers = { "Content-Type": "application/json", Cookie: cookie };
    response = await fetch(apiURL, {
      method,
      headers,
      cache: "no-store",
    });
  } else {
    // From client component (via proxy)
    apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
    const backendEndpoint = `/instructors/class/${classId}`;
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

  const data: Response<{ instructorId: number }> = await response.json();

  return data;
};

// Register instructor data
export const registerInstructor = async (
  userData: FormData,
  cookie: string,
): Promise<RegisterFormState> => {
  try {
    // From server component
    // Handle api based on whether an icon is included
    let apiURL = `${BACKEND_ORIGIN}/admins/instructor-list/register`;
    if (userData.has("icon")) {
      apiURL = `${BACKEND_ORIGIN}/admins/instructor-list/register/withIcon`;
    }
    const method = "POST";
    const headers = {
      Cookie: cookie,
    };
    const body = userData;
    const response = await fetch(apiURL, {
      method,
      headers,
      body,
    });

    if (response.status === 409) {
      const data = await response.json();
      const { items } = data;
      // Check the number of commas in the error message
      const commaCount = (items.match(/,/g) || []).length;
      if (commaCount === 0) {
        return { errorMessage: SINGLE_ITEM_ALREADY_REGISTERED_ERROR(items) };
      } else if (commaCount > 0) {
        return { errorMessage: MULTIPLE_ITEMS_ALREADY_REGISTERED_ERROR(items) };
      }
    }

    if (response.status !== 201) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    return {
      successMessage: INSTRUCTOR_REGISTRATION_SUCCESS_MESSAGE,
    };
  } catch (error) {
    console.error("API error while registering instructor:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
};

// Update instructor data
export const updateInstructor = async (
  id: number,
  userData: FormData,
  cookie: string,
) => {
  // From server component
  // Handle api based on whether an icon is included
  let apiURL = `${BACKEND_ORIGIN}/admins/instructor-list/update/${id}`;
  if (userData.has("icon")) {
    apiURL = `${BACKEND_ORIGIN}/admins/instructor-list/update/${id}/withIcon`;
  }
  const method = "PATCH";
  const headers = {
    Cookie: cookie,
  };
  const body = userData;

  // Define the data to be sent to the server side.
  const response = await fetch(apiURL, {
    method,
    headers,
    body,
  });

  const data = await response.json();

  if (response.status === 500) {
    return { errorMessage: data.message || ERROR_PAGE_MESSAGE_EN };
  }

  return data;
};

// Mask instructor information (Cron Job use only)
export const maskInstructor = async (authorization: string): Promise<void> => {
  try {
    // From server component
    const apiURL = `${BACKEND_ORIGIN}/jobs/mask/instructors`;
    const method = "PATCH";
    const headers = {
      "Content-Type": "application/json",
      Authorization: authorization,
    };
    await fetch(apiURL, {
      method,
      headers,
    });
  } catch (error) {
    console.error("Failed to mask instructor information:", error);
    throw error;
  }
};

export const getInstructorProfile = async (
  instructorId: number,
  cookie?: string,
) => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/${instructorId}/profile`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/${instructorId}/profile`;
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

    const instructorProfile: SimpleInstructorProfile = await response.json();
    return instructorProfile;
  } catch (error) {
    console.error("API error while fetching instructor profile:", error);
    throw new Error(FAILED_TO_FETCH_INSTRUCTOR_PROFILE);
  }
};

export const getInstructorProfiles = async (cookie?: string) => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/profiles`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/profiles`;
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

    const instructorProfiles: InstructorProfile[] = await response.json();
    return instructorProfiles;
  } catch (error) {
    console.error(
      "API error while fetching instructor profiles for rebooking page:",
      error,
    );
    throw new Error(FAILED_TO_FETCH_INSTRUCTOR_PROFILES);
  }
};

export const getInstructorProfilesByEnglishBackground = async (
  englishBackground: EnglishBackground,
  cookie?: string,
) => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/profiles/english-background/${englishBackground}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/profiles/english-background/${englishBackground}`;
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

    const instructorProfiles: InstructorProfile[] = await response.json();
    return instructorProfiles;
  } catch (error) {
    console.error(
      "API error while fetching instructor profiles by English background for rebooking page:",
      error,
    );
    throw new Error(FAILED_TO_FETCH_INSTRUCTOR_PROFILES);
  }
};

// GET all instructors profiles for customer dashboard
export const getAllInstructorProfiles = async (cookie?: string) => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/all-profiles`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        next: { tags: ["instructor-list"] },
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/all-profiles`;
      const revalidateTag = "instructor-list";
      headers = {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
        "revalidate-tag": revalidateTag,
      };
      response = await fetch(apiURL, {
        method,
        headers,
      });
    }

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: { instructorProfiles: DetailedInstructorProfile[] } =
      await response.json();
    return data.instructorProfiles;
  } catch (error) {
    console.error("Failed to fetch all instructor profiles:", error);
    throw error;
  }
};

export const getInstructorTagCatalog = async (
  cookie?: string,
): Promise<TagCatalogResponse["tags"]> => {
  const method = "GET";
  let apiURL;
  let headers;
  let response;

  if (cookie) {
    apiURL = `${BASE_URL}/tags`;
    headers = { "Content-Type": "application/json", Cookie: cookie };
    response = await fetch(apiURL, { method, headers, cache: "no-store" });
  } else {
    apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
    headers = {
      "Content-Type": "application/json",
      "backend-endpoint": "/instructors/tags",
      "no-cache": "no-cache",
    };
    response = await fetch(apiURL, { method, headers });
  }

  if (response.status !== 200) {
    throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
  }

  const data: TagCatalogResponse = await response.json();
  return data.tags;
};

export const getInstructorTags = async (
  instructorId: number,
  cookie?: string,
): Promise<InstructorTagsResponse> => {
  const method = "GET";
  let apiURL;
  let headers;
  let response;

  if (cookie) {
    apiURL = `${BASE_URL}/${instructorId}/tags`;
    headers = { "Content-Type": "application/json", Cookie: cookie };
    response = await fetch(apiURL, { method, headers, cache: "no-store" });
  } else {
    apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
    headers = {
      "Content-Type": "application/json",
      "backend-endpoint": `/instructors/${instructorId}/tags`,
      "no-cache": "no-cache",
    };
    response = await fetch(apiURL, { method, headers });
  }

  if (response.status !== 200) {
    throw new Error("Failed to fetch instructor tags");
  }

  return (await response.json()) as InstructorTagsResponse;
};

export const createInstructorTag = async (label: string, cookie: string) => {
  const response = await fetch(`${BASE_URL}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ label }),
  });

  if (response.status !== 201) {
    const data = await response.json();
    throw new Error(data.message || "Failed to create tag");
  }

  const data = (await response.json()) as {
    tag: TagCatalogResponse["tags"][number];
  };
  return data.tag;
};

export const deleteInstructorTag = async (tagId: number, cookie: string) => {
  const response = await fetch(`${BASE_URL}/tags/${tagId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Cookie: cookie },
  });

  if (response.status !== 200) {
    throw new Error("Failed to delete tag");
  }

  return (await response.json()) as { success: boolean };
};

export const saveInstructorTags = async (
  instructorId: number,
  payload: UpdateInstructorTagsRequest,
  cookie: string,
) => {
  const response = await fetch(`${BASE_URL}/${instructorId}/tags`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(payload),
  });

  if (response.status !== 200) {
    throw new Error("Failed to save instructor tags");
  }

  return (await response.json()) as { success: boolean };
};

export const getCalendarClasses = async (
  instructorId: number,
  cookie?: string,
): Promise<EventType[] | []> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BACKEND_ORIGIN}/instructors/${instructorId}/calendar-classes`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/${instructorId}/calendar-classes`;
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
    console.error(
      "API error while fetching instructor calendar classes:",
      error,
    );
    throw new Error(FAILED_TO_FETCH_INSTRUCTOR_CLASSES);
  }
};

export const getSameDateClasses = async (
  instructorId: number,
  classId: number,
  cookie?: string,
): Promise<{
  selectedClassDetails: InstructorClassDetail;
  sameDateClasses: InstructorClassDetail[] | [];
}> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/${instructorId}/classes/${classId}/same-date`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/${instructorId}/classes/${classId}/same-date`;
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

    return await response.json();
  } catch (error) {
    console.error(
      "API error while fetching same-date classes for instructor:",
      error,
    );
    throw new Error(FAILED_TO_FETCH_INSTRUCTOR_CLASSES);
  }
};

// Versioned Schedule System APIs
export const getInstructorSchedules = async (
  instructorId: number,
  cookie?: string,
) => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/${instructorId}/schedules`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/${instructorId}/schedules`;
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

    const result = (await response.json()) as { data: InstructorSchedule[] };

    return { schedules: result.data };
  } catch (error) {
    console.error("Failed to fetch instructor schedules:", error);
    throw error;
  }
};

export const getInstructorScheduleById = async (
  instructorId: number,
  scheduleId: number,
  cookie?: string,
) => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/${instructorId}/schedules/${scheduleId}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/${instructorId}/schedules/${scheduleId}`;
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

    const result = (await response.json()) as {
      data: InstructorScheduleWithSlots;
    };

    return { schedule: result.data };
  } catch (error) {
    console.error("Failed to fetch instructor schedule details:", error);
    throw error;
  }
};

export const createInstructorSchedule = async (
  instructorId: number,
  effectiveFrom: string,
  slots: Omit<InstructorSlot, "scheduleId">[],
  cookie?: string,
) => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "POST";
    const body = JSON.stringify({
      effectiveFrom,
      slots,
      timezone: "Asia/Tokyo",
    } as CreateScheduleRequest);

    if (cookie) {
      // From server component
      const apiURL = `${BASE_URL}/${instructorId}/schedules`;
      const headers = {
        "Content-Type": "application/json",
        Cookie: cookie,
      };
      response = await fetch(apiURL, {
        method,
        headers,
        body,
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/${instructorId}/schedules`;
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

    if (response.status !== 201) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = (await response.json()) as {
      data: {
        schedule: ActiveInstructorSchedule;
        impactSummary: ScheduleUpdateImpactSummary;
      };
    };

    return result.data;
  } catch (error) {
    console.error("Failed to create instructor schedule:", error);
    throw error;
  }
};

export const getInstructorAvailableSlots = async (
  instructorId: number,
  startDate: string,
  endDate: string,
  excludeBookedSlots: boolean,
  cookie?: string,
) => {
  try {
    const params = new URLSearchParams({
      start: startDate,
      end: endDate,
      timezone: "Asia/Tokyo",
      excludeBookedSlots: excludeBookedSlots.toString(),
    } as AvailableSlotsQuery & { excludeBookedSlots: string });

    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/${instructorId}/available-slots?${params}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/${instructorId}/available-slots?${params}`;
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

    const result = (await response.json()) as { data: AvailableSlot[] };

    return { data: result.data };
  } catch (error) {
    console.error("Failed to fetch instructor available slots:", error);
    throw error;
  }
};

export const getAllInstructorAvailableSlots = async (
  startDate: string,
  endDate: string,
  englishBackground: EnglishBackground,
  cookie?: string,
) => {
  try {
    const params = new URLSearchParams({
      start: startDate,
      end: endDate,
      timezone: "Asia/Tokyo",
      englishBackground: String(englishBackground),
    });

    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/available-slots?${params}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/available-slots?${params}`;
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
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = (await response.json()) as AvailableSlotsResponse;
    return data;
  } catch (error) {
    console.error("Failed to fetch all instructor available slots:", error);
    return { message: "Failed to fetch available slots" };
  }
};

export const getInstructorAvailableSlotsByType = async (
  startDate: string,
  endDate: string,
  englishBackground: EnglishBackground,
  cookie?: string,
) => {
  try {
    const params = new URLSearchParams({
      start: startDate,
      end: endDate,
      timezone: "Asia/Tokyo",
    });

    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/available-slots/by-type?${params}&englishBackground=${englishBackground}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/available-slots/by-type?${params}&englishBackground=${englishBackground}`;
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
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = (await response.json()) as AvailableSlotsResponse;
    return data;
  } catch (error) {
    console.error(
      "Failed to fetch native or non native instructor available slots:",
      error,
    );
    return { message: "Failed to fetch available slots" };
  }
};

// Instructor Absence APIs
export const getInstructorAbsences = async (
  instructorId: number,
  cookie?: string,
) => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/${instructorId}/absences`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/${instructorId}/absences`;
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

    const result: InstructorAbsencesResponse = await response.json();

    return { absences: result.data };
  } catch (error) {
    console.error("Failed to fetch instructor absences:", error);
    throw error;
  }
};

export const addInstructorAbsence = async (
  instructorId: number,
  absentAt: string,
  cookie: string,
) => {
  try {
    // From server component
    const apiURL = `${BASE_URL}/${instructorId}/absences`;
    const method = "POST";
    const headers = {
      "Content-Type": "application/json",
      Cookie: cookie,
    };
    const body = JSON.stringify({ absentAt });
    const response = await fetch(apiURL, {
      method,
      headers,
      body,
      credentials: "include",
    });

    if (response.status !== 201) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: CreateAbsenceResponse = await response.json();

    return { absence: result.data };
  } catch (error) {
    console.error("Failed to add instructor absence:", error);
    throw error;
  }
};

export const deleteInstructorAbsence = async (
  instructorId: number,
  absentAt: string,
  cookie: string,
) => {
  try {
    // From server component
    const encodedAbsentAt = encodeURIComponent(absentAt);
    const apiURL = `${BASE_URL}/${instructorId}/absences/${encodedAbsentAt}`;
    const method = "DELETE";
    const headers = {
      "Content-Type": "application/json",
      Cookie: cookie,
    };

    const response = await fetch(apiURL, {
      method,
      headers,
      credentials: "include",
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: DeleteAbsenceResponse = await response.json();

    return { absence: result.data };
  } catch (error) {
    console.error("Failed to delete instructor absence:", error);
    throw error;
  }
};

// Get active schedule for an instructor
export const getActiveInstructorSchedule = async (
  instructorId: number,
  effectiveDate: string,
  cookie?: string,
) => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = new URL(`${BASE_URL}/${instructorId}/schedules/active`);
      apiURL.searchParams.append("effectiveDate", effectiveDate);
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/instructors/${instructorId}/schedules/active?effectiveDate=${encodeURIComponent(
        effectiveDate,
      )}`;
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

    const result = (await response.json()) as {
      data: InstructorScheduleWithSlots;
    };

    return { schedule: result.data };
  } catch (error) {
    console.error("Failed to fetch active instructor schedule:", error);
    throw error;
  }
};

// Delete instructors who have left the service more than 3 years ago (Only for Vercel Cron Job)
export const deletePastInstructors = async (authorization: string) => {
  try {
    // From server component
    const apiUrl = `${BACKEND_ORIGIN}/jobs/delete/past-instructors`;
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
    console.error("API error while deleting past instructors:", error);
    throw error;
  }
};
