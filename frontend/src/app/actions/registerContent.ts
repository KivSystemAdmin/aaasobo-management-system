"use server";

import { registerPlan } from "@/lib/api/plansApi";
import { registerEvent } from "@/lib/api/eventsApi";
import { GENERAL_ERROR_MESSAGE } from "@/lib/messages/formValidation";
import { extractRegisterValidationErrors } from "@/lib/utils/validationErrorUtils";
import { planRegisterSchema, eventRegisterSchema } from "@/schemas/authSchema";
import { revalidatePlanList, revalidateEventList } from "./revalidate";
import { getCookie } from "../../proxy";

export async function registerContent(
  prevState: RegisterFormState | undefined,
  formData: FormData,
): Promise<RegisterFormState> {
  const planNameEng = formData.get("planNameEng");
  const planNameJpn = formData.get("planNameJpn");
  const eventNameEng = formData.get("eventNameEng");
  const eventNameJpn = formData.get("eventNameJpn");
  const weeklyClassTimes = Number(formData.get("weeklyClassTimes"));
  const color = formData.get("color");
  const description = formData.get("description");
  const categoryType = formData.get("categoryType");
  const englishBackground = Number(formData.get("englishBackground"));

  try {
    // Get the cookies from the request headers
    const cookie = await getCookie();

    let parsedForm;
    let response;

    switch (categoryType) {
      case "plan":
        parsedForm = planRegisterSchema.safeParse({
          planNameEng,
          planNameJpn,
          weeklyClassTimes,
          description,
          englishBackground,
        });
        if (!parsedForm.success) {
          const validationErrors = parsedForm.error.issues;
          return extractRegisterValidationErrors(validationErrors);
        }

        response = await registerPlan({
          planNameEng: parsedForm.data.planNameEng,
          planNameJpn: parsedForm.data.planNameJpn,
          weeklyClassTimes: parsedForm.data.weeklyClassTimes,
          description: parsedForm.data.description,
          englishBackground: parsedForm.data.englishBackground,
          cookie,
        });

        if (response.successMessage) {
          // Refresh cached plan data for the plan list page
          await revalidatePlanList();
        }

        return response;

      case "event":
        parsedForm = eventRegisterSchema.safeParse({
          eventNameEng,
          eventNameJpn,
          color,
        });
        if (!parsedForm.success) {
          const validationErrors = parsedForm.error.issues;
          return extractRegisterValidationErrors(validationErrors);
        }

        response = await registerEvent({
          eventNameJpn: parsedForm.data.eventNameJpn,
          eventNameEng: parsedForm.data.eventNameEng,
          color: parsedForm.data.color,
          cookie,
        });

        if (response.successMessage) {
          // Refresh cached event data for the event list page
          await revalidateEventList();
        }

        return response;

      default:
        return {
          errorMessage: "Invalid category type.",
        };
    }
  } catch (error) {
    console.error("Unexpected error in registerContent server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}
