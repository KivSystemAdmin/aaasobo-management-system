import {
  EMAIL_ALREADY_REGISTERED_ERROR,
  GENERAL_ERROR_MESSAGE,
  ADMIN_REGISTRATION_SUCCESS_MESSAGE,
} from "../messages/formValidation";
import { ERROR_PAGE_MESSAGE_EN } from "../messages/generalMessages";
import {
  type AdminResponse,
  type AdminsListResponse,
  type CreateInstructorFeeRequest,
  type CreateInstructorFeeResponse,
  type DeleteLatestInstructorFeeResponse,
  type InstructorFeeErrorResponse,
  type InstructorFeeRatesResponse,
  type InstructorPayrollErrorResponse,
  type InstructorPayrollResponse,
  type InstructorsListResponse,
  type PastInstructorsListResponse,
  type CustomersListResponse,
  type PastCustomersListResponse,
  type ChildrenListResponse,
  type PlansListResponse,
  type SubscriptionsListResponse,
  type EventsListResponse,
  type ClassesListResponse,
  type SchedulesListResponse,
  type UpdateAdminResponse,
  type DeleteResponse,
  type RegisterAdminRequest,
  type UpdateAdminRequest,
  type MessageBoardPostsResponse,
  type CreateMessageBoardPostRequest,
  type CreateMessageBoardPostResponse,
} from "@shared/schemas/admins";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";
const BASE_URL = `${BACKEND_ORIGIN}/admins`;

type Response<T> = T | { message: string };
export type InstructorPayrollApiError = InstructorPayrollErrorResponse & {
  status: number;
};
type InstructorFeeApiError = InstructorFeeErrorResponse & {
  status: number;
};

export const getAdminById = async (
  id: number,
  cookie?: string,
): Promise<Response<AdminResponse>> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/admin-list/${id}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      const backendEndpoint = `/admins/admin-list/${id}`;
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
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

    const data: Response<AdminResponse> = await response.json();

    return data;
  } catch (error) {
    console.error("Failed to fetch admin by ID:", error);
    throw error;
  }
};

// GET all admins data
export const getAllAdmins = async (
  cookie?: string,
): Promise<AdminsListResponse["data"]> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/admin-list`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        next: { tags: ["admin-list"] },
      });
    } else {
      // From client component (via proxy)
      const backendEndpoint = `/admins/admin-list`;
      const revalidateTag = "admin-list";
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
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
    const result: AdminsListResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch admins:", error);
    throw error;
  }
};

// GET all instructors data for instructor list
export const getAllInstructors = async (
  cookie?: string,
): Promise<InstructorsListResponse["data"]> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/instructor-list`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        next: { tags: ["instructor-list"] },
      });
    } else {
      // From client component (via proxy)
      const backendEndpoint = `/admins/instructor-list`;
      const revalidateTag = "instructor-list";
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
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
    const result: InstructorsListResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch instructors:", error);
    throw error;
  }
};

// GET all instructors data for instructor list
export const getAllPastInstructors = async (
  cookie?: string,
): Promise<PastInstructorsListResponse["data"]> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/instructor-list/past`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        next: { tags: ["instructor-list"] },
      });
    } else {
      // From client component (via proxy)
      const backendEndpoint = `/admins/instructor-list/past`;
      const revalidateTag = "instructor-list";
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
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
    const result: PastInstructorsListResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch past instructors:", error);
    throw error;
  }
};

// GET all customers data
export const getAllCustomers = async (
  cookie?: string,
): Promise<CustomersListResponse["data"]> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/customer-list`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        next: { tags: ["customer-list"] },
      });
    } else {
      // From client component (via proxy)
      const backendEndpoint = `/admins/customer-list`;
      const revalidateTag = "customer-list";
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
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
    const result: CustomersListResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    throw error;
  }
};

// GET all past customers data
export const getAllPastCustomers = async (
  cookie?: string,
): Promise<PastCustomersListResponse["data"]> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/customer-list/past`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        next: { tags: ["customer-list"] },
      });
    } else {
      // From client component (via proxy)
      const backendEndpoint = `/admins/customer-list/past`;
      const revalidateTag = "customer-list";
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
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
    const result: PastCustomersListResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch past customers:", error);
    throw error;
  }
};

// GET all children data
export const getAllChildren = async (
  cookie?: string,
): Promise<ChildrenListResponse["data"]> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/child-list`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        next: { tags: ["child-list"] },
      });
    } else {
      // From client component (via proxy)
      const backendEndpoint = `/admins/child-list`;
      const revalidateTag = "child-list";
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
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
    const result: ChildrenListResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch children:", error);
    throw error;
  }
};

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
      apiURL = `${BASE_URL}/plan-list`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        next: { tags: ["plan-list"] },
      });
    } else {
      // From client component (via proxy)
      const backendEndpoint = `/admins/plan-list`;
      const revalidateTag = "plan-list";
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      headers = {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
        "revalidate-tag": revalidateTag,
      };
      response = await fetch(apiURL, {
        method,
        headers,
        credentials: "include",
      });
    }

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: PlansListResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    throw error;
  }
};

// GET all subscriptions data
export const getAllSubscriptions = async (
  cookie?: string,
): Promise<SubscriptionsListResponse["data"]> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/subscription-list`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        next: { tags: ["subscription-list"] },
      });
    } else {
      // From client component (via proxy)
      const backendEndpoint = `/admins/subscription-list`;
      const revalidateTag = "subscription-list";
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
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
    const result: SubscriptionsListResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    throw error;
  }
};

// GET all events data
export const getAllEvents = async (
  cookie?: string,
): Promise<EventsListResponse["data"]> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/event-list`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        next: { tags: ["event-list"] },
      });
    } else {
      // From client component (via proxy)
      const backendEndpoint = `/admins/event-list`;
      const revalidateTag = "event-list";
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
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
    const result: EventsListResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    throw error;
  }
};

// GET all class data
export const getAllClasses = async (
  todayOnly: boolean = false,
  cookie?: string,
): Promise<ClassesListResponse["data"]> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/class-list${todayOnly ? "?today=true" : ""}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      // From client component (via proxy)
      const backendEndpoint = `/admins/class-list${todayOnly ? "?today=true" : ""}`;
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
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
    const result: ClassesListResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    throw error;
  }
};

// GET all schedule data
export const getAllBusinessSchedules = async (
  cookie?: string,
): Promise<SchedulesListResponse> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      // From server component
      apiURL = `${BASE_URL}/business-schedule`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        next: { tags: ["business-schedule"] },
      });
    } else {
      // From client component (via proxy)
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      const backendEndpoint = `/admins/business-schedule`;
      const revalidateTag = "business-schedule";
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
    const data: SchedulesListResponse = await response.json();

    return data;
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    throw error;
  }
};

export const getMessageBoardPosts = async (
  cookie?: string,
): Promise<MessageBoardPostsResponse["data"]> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";

    if (cookie) {
      apiURL = `${BASE_URL}/message-board`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      const backendEndpoint = "/admins/message-board";
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
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

    const result: MessageBoardPostsResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch message board posts:", error);
    throw error;
  }
};

export const createMessageBoardPost = async (
  payload: CreateMessageBoardPostRequest,
  cookie?: string,
): Promise<CreateMessageBoardPostResponse> => {
  let apiURL;
  let headers;
  let response;

  if (cookie) {
    apiURL = `${BASE_URL}/message-board`;
    headers = { "Content-Type": "application/json", Cookie: cookie };
    response = await fetch(apiURL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } else {
    const backendEndpoint = "/admins/message-board";
    apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
    headers = {
      "Content-Type": "application/json",
      "backend-endpoint": backendEndpoint,
    };
    response = await fetch(apiURL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  }

  if (response.status !== 201) {
    const data = await response.json();
    throw new Error(data?.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const getInstructorPayroll = async (
  instructorId: number,
  month: string,
  cookie?: string,
  audience: "admin" | "instructor" = "admin",
): Promise<InstructorPayrollResponse | InstructorPayrollApiError> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";
    const backendEndpoint = `/${audience === "admin" ? "admins/instructors" : "instructors"}/${instructorId}/payroll?month=${month}`;

    if (cookie) {
      apiURL = `${BACKEND_ORIGIN}${backendEndpoint}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      headers = {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
        "no-cache": "true",
      };
      response = await fetch(apiURL, {
        method,
        headers,
      });
    }

    const data = await response.json();

    if (response.status !== 200) {
      return {
        status: response.status,
        code:
          typeof data?.code === "string"
            ? data.code
            : "INSTRUCTOR_PAYROLL_ERROR",
        message:
          typeof data?.message === "string"
            ? data.message
            : `HTTP error! status: ${response.status}`,
      };
    }

    return data as InstructorPayrollResponse;
  } catch (error) {
    console.error("Failed to fetch instructor payroll:", error);
    return {
      status: 500,
      code: "INSTRUCTOR_PAYROLL_ERROR",
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const getInstructorFees = async (
  instructorId: number,
  cookie?: string,
): Promise<InstructorFeeRatesResponse | InstructorFeeApiError> => {
  try {
    let apiURL;
    let headers;
    let response;
    const method = "GET";
    const backendEndpoint = `/admins/instructors/${instructorId}/fees`;

    if (cookie) {
      apiURL = `${BACKEND_ORIGIN}${backendEndpoint}`;
      headers = { "Content-Type": "application/json", Cookie: cookie };
      response = await fetch(apiURL, {
        method,
        headers,
        cache: "no-store",
      });
    } else {
      apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
      headers = {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
        "no-cache": "true",
      };
      response = await fetch(apiURL, {
        method,
        headers,
      });
    }

    const data = await response.json();

    if (response.status !== 200) {
      return {
        status: response.status,
        code:
          typeof data?.code === "string" ? data.code : "INSTRUCTOR_FEE_ERROR",
        message:
          typeof data?.message === "string"
            ? data.message
            : `HTTP error! status: ${response.status}`,
      };
    }

    return data as InstructorFeeRatesResponse;
  } catch (error) {
    console.error("Failed to fetch instructor fees:", error);
    return {
      status: 500,
      code: "INSTRUCTOR_FEE_ERROR",
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const createInstructorFee = async (
  instructorId: number,
  feeData: CreateInstructorFeeRequest,
): Promise<CreateInstructorFeeResponse | InstructorFeeApiError> => {
  try {
    const backendEndpoint = `/admins/instructors/${instructorId}/fees`;
    const apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
      },
      body: JSON.stringify(feeData),
    });

    const data = await response.json();

    if (response.status !== 201) {
      return {
        status: response.status,
        code:
          typeof data?.code === "string" ? data.code : "INSTRUCTOR_FEE_ERROR",
        message:
          typeof data?.message === "string"
            ? data.message
            : `HTTP error! status: ${response.status}`,
      };
    }

    return data as CreateInstructorFeeResponse;
  } catch (error) {
    console.error("Failed to create instructor fee:", error);
    return {
      status: 500,
      code: "INSTRUCTOR_FEE_ERROR",
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteLatestInstructorFee = async (
  instructorId: number,
): Promise<DeleteLatestInstructorFeeResponse | InstructorFeeApiError> => {
  try {
    const backendEndpoint = `/admins/instructors/${instructorId}/fees/latest`;
    const apiURL = `${process.env.NEXT_PUBLIC_FRONTEND_ORIGIN}/api/proxy`;
    const response = await fetch(apiURL, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "backend-endpoint": backendEndpoint,
      },
    });

    const data = await response.json();

    if (response.status !== 200) {
      return {
        status: response.status,
        code:
          typeof data?.code === "string" ? data.code : "INSTRUCTOR_FEE_ERROR",
        message:
          typeof data?.message === "string"
            ? data.message
            : `HTTP error! status: ${response.status}`,
      };
    }

    return data as DeleteLatestInstructorFeeResponse;
  } catch (error) {
    console.error("Failed to delete latest instructor fee:", error);
    return {
      status: 500,
      code: "INSTRUCTOR_FEE_ERROR",
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const registerAdmin = async (
  userData: RegisterAdminRequest & {
    cookie: string;
  },
): Promise<RegisterFormState> => {
  try {
    // From server component
    // Define the data to be sent to the server side.
    const apiURL = `${BACKEND_ORIGIN}/admins/admin-list/register`;
    const response = await fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userData.cookie },
      body: JSON.stringify(userData),
    });

    if (response.status === 409) {
      return { email: EMAIL_ALREADY_REGISTERED_ERROR.en };
    }

    if (response.status !== 201) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    return {
      successMessage: ADMIN_REGISTRATION_SUCCESS_MESSAGE,
    };
  } catch (error) {
    console.error("API error while registering admin:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
};

// PATCH admin data
export const updateAdmin = async (
  adminId: number,
  adminData: UpdateAdminRequest,
  cookie: string,
): Promise<UpdateFormState> => {
  try {
    // From server component
    // Define the data to be sent to the server side.
    const apiURL = `${BACKEND_ORIGIN}/admins/${adminId}`;
    const headers = { "Content-Type": "application/json", Cookie: cookie };
    const body = JSON.stringify(adminData);

    const response = await fetch(apiURL, {
      method: "PATCH",
      headers,
      body,
    });

    if (response.status === 409) {
      return { email: EMAIL_ALREADY_REGISTERED_ERROR.en };
    }

    const data: UpdateAdminResponse = await response.json();

    if (response.status !== 200) {
      return { errorMessage: data.message || ERROR_PAGE_MESSAGE_EN };
    }

    return data;
  } catch (error) {
    console.error("API error while updating admin:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
};

// DELETE admin data
export const deleteAdmin = async (
  adminId: number,
  cookie: string,
): Promise<DeleteResponse | { errorMessage: string }> => {
  try {
    // From server component
    // Define the data to be sent to the server side.
    const apiURL = `${BACKEND_ORIGIN}/admins/admin-list/${adminId}`;
    const headers = { "Content-Type": "application/json", Cookie: cookie };
    const response = await fetch(apiURL, {
      method: "DELETE",
      headers,
    });

    if (response.status !== 200) {
      return { errorMessage: ERROR_PAGE_MESSAGE_EN };
    }
    const result: DeleteResponse = await response.json();

    return result;
  } catch (error) {
    console.error("Failed to delete the admin:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
};

// Delete admins who have left the service more than 3 years ago (Only for Vercel Cron Job)
export const deletePastAdmins = async (authorization: string) => {
  try {
    // From server component
    const apiUrl = `${BACKEND_ORIGIN}/jobs/delete/past-admins`;
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
    console.error("API error while deleting past admins:", error);
    throw error;
  }
};

// Delete message board posts that are older than the threshold (Only for Vercel Cron Job)
export const deletePastMessageBoardPosts = async (authorization: string) => {
  try {
    // From server component
    const apiUrl = `${BACKEND_ORIGIN}/jobs/delete/past-message-board-posts`;
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
    console.error("API error while deleting past message board posts:", error);
    throw error;
  }
};
