"use server";

import { updateEvent } from "@/lib/api/eventsApi";
import { updatePlan } from "@/lib/api/plansApi";
import { updateBusinessSchedule } from "@/lib/api/calendarsApi";
import {
  GENERAL_ERROR_MESSAGE,
  UNEXPECTED_ERROR_MESSAGE,
} from "@/lib/messages/formValidation";
import { extractUpdateValidationErrors } from "@/lib/utils/validationErrorUtils";
import {
  eventUpdateSchema,
  planUpdateSchema,
  generateClassesSchema,
  scheduleUpdateSchema,
} from "@/schemas/authSchema";
import {
  revalidateEventList,
  revalidateBusinessSchedule,
  revalidateClassList,
  revalidatePlanList,
  revalidateSubscriptionList,
} from "./revalidate";
import { getCookie } from "@/proxy";
import { validateSession } from "./validateSession";
import {
  generateClasses,
  updateAttendance,
  updateClassStatus,
} from "@/lib/api/classesApi";
import { revalidatePath } from "next/cache";
import {
  updateSelectTypeUrl,
  updateSubscriptionToAddClass,
  updateSubscriptionToTerminateClass,
} from "@/lib/api/subscriptionsApi";
import {
  UpdateSelectTypeUrlRequest,
  UpdateSubscriptionToAddClassRequest,
  UpdateSubscriptionToTerminateClassRequest,
} from "@shared/schemas/admins";
import { EnglishBackground } from "@/types";

export async function updateEventAction(
  prevState: UpdateFormState | undefined,
  formData: FormData,
): Promise<UpdateFormState> {
  try {
    const eventNameEng = formData.get("eventNameEng");
    const eventNameJpn = formData.get("eventNameJpn");
    const color = formData.get("color");
    // Hidden input tag fields
    const eventId = Number(formData.get("eventId"));

    const parsedForm = eventUpdateSchema.safeParse({
      eventNameEng,
      eventNameJpn,
      color,
    });

    if (!parsedForm.success) {
      const validationErrors = parsedForm.error.issues;
      return extractUpdateValidationErrors(validationErrors);
    }

    // Get the cookies from the request headers
    const cookie = await getCookie();

    const response = await updateEvent({
      eventId,
      eventNameJpn: parsedForm.data.eventNameJpn,
      eventNameEng: parsedForm.data.eventNameEng,
      color: parsedForm.data.color,
      cookie,
    });

    // Refresh cached event data for the event list page
    revalidateEventList();

    return response;
  } catch (error) {
    console.error("Unexpected error in updateContent server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}

export async function updatePlanAction(
  prevState: UpdateFormState | undefined,
  formData: FormData,
): Promise<UpdateFormState> {
  try {
    const planNameEng = formData.get("planNameEng");
    const planNameJpn = formData.get("planNameJpn");
    const description = formData.get("description");
    // Hidden input tag fields
    const planId = Number(formData.get("planId"));
    const englishBackground = Number(formData.get("englishBackground"));

    let requestNameEng: string | null = null;
    let requestNameJpn: string | null = null;
    let requestDescription: string | null = null;
    let requestEnglishBackground: EnglishBackground | null = null;

    const parsedForm = planUpdateSchema.safeParse({
      planNameEng,
      planNameJpn,
      description,
      englishBackground,
    });

    if (!parsedForm.success) {
      const validationErrors = parsedForm.error.issues;
      return extractUpdateValidationErrors(validationErrors);
    }

    requestNameEng = parsedForm.data.planNameEng;
    requestNameJpn = parsedForm.data.planNameJpn;
    requestDescription = parsedForm.data.description;
    requestEnglishBackground = parsedForm.data.englishBackground;

    // Get the cookies from the request headers
    const cookie = await getCookie();

    const response = await updatePlan(
      planId,
      requestNameEng,
      requestNameJpn,
      requestDescription,
      requestEnglishBackground,
      cookie,
    );

    // Refresh cached plan data for the plan list page
    revalidatePlanList();

    return response;
  } catch (error) {
    console.error("Unexpected error in updateContent server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}

export async function updateScheduleAction(
  prevState: UpdateFormState | undefined,
  formData: FormData,
): Promise<UpdateFormState> {
  try {
    const startDate = String(formData.get("startDate"));
    const endDate = String(formData.get("endDate")) || undefined;
    const eventId = Number(formData.get("eventId"));

    const parsedForm = scheduleUpdateSchema.safeParse({
      eventId,
    });

    if (!parsedForm.success) {
      const validationErrors = parsedForm.error.issues;
      return extractUpdateValidationErrors(validationErrors);
    }

    // Get the cookies from the request headers
    const cookie = await getCookie();

    // Update the business schedule
    const response = await updateBusinessSchedule(
      eventId,
      startDate,
      endDate,
      cookie,
    );

    // Refresh cached schedule data for the business calendar page
    revalidateBusinessSchedule();

    return response;
  } catch (error) {
    console.error("Unexpected error in updateContent server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}

export async function updateAttendanceAction(
  classId: number,
  childrenIds: number[],
  instructorId: number,
  adminId?: number,
): Promise<{ success: boolean; message: string }> {
  const userId = adminId ? adminId : instructorId;

  const { isValid, error, userType } = await validateSession(userId);

  if (!isValid) {
    return { success: false, message: error! };
  }

  // Get the cookies from the request headers
  const cookie = await getCookie();

  const result = await updateAttendance(classId, childrenIds, cookie);

  if (!result.success)
    return {
      success: false,
      message:
        "Failed to update attendance. Please try again later. If the problem persists, contact the staff.",
    };

  const path =
    userType === "admin"
      ? `/admins/instructor-list/${instructorId}/class-schedule`
      : "/instructors/class-schedule";

  revalidatePath(path);

  // Refresh cached class data for the class list page
  revalidateClassList();

  return { success: true, message: "Attendance updated successfully." };
}

export async function updateClassStatusAction(
  classId: number,
  status: ClassStatus,
  instructorId: number,
  adminId?: number,
): Promise<{ success: boolean; message: string }> {
  const userId = adminId ? adminId : instructorId;

  const { isValid, error, userType } = await validateSession(userId);

  if (!isValid) {
    return { success: false, message: error! };
  }

  // Get the cookies from the request headers
  const cookie = await getCookie();

  const result = await updateClassStatus(classId, status, cookie);

  if (!result.success)
    return {
      success: false,
      message:
        userType === "admin"
          ? "Failed to update class status. Please try again later."
          : "Failed to complete the class. Please try again later. If the problem persists, contact the staff.",
    };

  const path =
    userType === "admin"
      ? `/admins/instructor-list/${instructorId}/class-schedule`
      : "/instructors/class-schedule";

  revalidatePath(path);

  // Refresh cached class data for the class list page
  revalidateClassList();

  return {
    success: true,
    message:
      userType === "admin"
        ? "Class status updated successfully."
        : "Class completed successfully.",
  };
}

export async function generateClassesAction(
  prevState: UpdateFormState | undefined,
  formData: FormData,
): Promise<UpdateFormState> {
  try {
    const yearMonth = String(formData.get("yearMonth"));
    const [month, year] = yearMonth.split(" ");

    const parsedForm = generateClassesSchema.safeParse({
      year,
      month,
    });

    if (!parsedForm.success) {
      return {
        errorMessage: "対象月を選択してください。",
      };
    }

    // Get the cookies from the request headers
    const cookie = await getCookie();

    // Update the business schedule
    await generateClasses(Number(year), month, cookie);

    // Refresh cached class data for the class list page
    revalidateClassList();

    return {
      successMessage: "クラスを生成しました。",
    };
  } catch (error) {
    console.error("Unexpected error in updateContent server action:", error);
    return {
      errorMessage: UNEXPECTED_ERROR_MESSAGE.ja,
    };
  }
}

export async function updateSubscriptionToAddClassAction(
  subscriptionId: number,
  updateDate: UpdateSubscriptionToAddClassRequest,
): Promise<DeleteFormState> {
  try {
    const cookie = await getCookie();
    const response = await updateSubscriptionToAddClass(
      subscriptionId,
      updateDate,
      cookie,
    );

    // Refresh cached subscription data for the subscription list page
    revalidateSubscriptionList();

    return response;
  } catch (error) {
    console.error("Unexpected error in updateContent server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}

export async function updateSubscriptionToTerminateClassAction(
  subscriptionId: number,
  updateDate: UpdateSubscriptionToTerminateClassRequest,
): Promise<DeleteFormState> {
  try {
    const cookie = await getCookie();
    const response = await updateSubscriptionToTerminateClass(
      subscriptionId,
      updateDate,
      cookie,
    );

    // Refresh cached subscription data for the subscription list page
    revalidateSubscriptionList();

    return response;
  } catch (error) {
    console.error("Unexpected error in updateContent server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}

export async function updateSelectTypeUrlAction(
  subscriptionId: number,
  updateDate: UpdateSelectTypeUrlRequest,
): Promise<DeleteFormState> {
  try {
    const cookie = await getCookie();
    const response = await updateSelectTypeUrl(
      subscriptionId,
      updateDate,
      cookie,
    );

    // Refresh cached subscription data for the subscription list page
    revalidateSubscriptionList();

    return response;
  } catch (error) {
    console.error("Unexpected error in updateContent server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}
