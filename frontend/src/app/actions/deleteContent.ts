"use server";

import { deleteEvent } from "@/lib/api/eventsApi";
import { deletePlan } from "@/lib/api/plansApi";
import { GENERAL_ERROR_MESSAGE } from "@/lib/messages/formValidation";
import {
  revalidateEventList,
  revalidatePlanList,
  revalidateSubscriptionList,
} from "./revalidate";
import { getCookie } from "@/proxy";
import { deleteSubscription } from "@/lib/api/subscriptionsApi";

export async function deleteEventAction(
  prevState: DeleteFormState | undefined,
  formData: FormData,
): Promise<DeleteFormState> {
  try {
    // Hidden input tag field
    const id = Number(formData.get("id"));

    // Get the cookies from the request headers
    const cookie = await getCookie();

    // Delete the event using the API
    const response = await deleteEvent(id, cookie);

    // Refresh cached event data for the event list page
    revalidateEventList();

    return response;
  } catch (error) {
    console.error("Unexpected error in deleteContent server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}

export async function deletePlanAction(
  prevState: DeleteFormState | undefined,
  formData: FormData,
): Promise<DeleteFormState> {
  try {
    // Hidden input tag field
    const id = Number(formData.get("id"));

    // Get the cookies from the request headers
    const cookie = await getCookie();

    // Delete the plan using the API
    const response = await deletePlan(id, cookie);

    // Refresh cached plan data for the plan list page
    revalidatePlanList();

    return response;
  } catch (error) {
    console.error("Unexpected error in deleteContent server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}

export async function deleteSubscriptionAction(
  subscriptionId: number,
  cancellationDate: string,
): Promise<DeleteFormState> {
  try {
    const cookie = await getCookie();
    const response = await deleteSubscription(
      subscriptionId,
      cancellationDate,
      cookie,
    );

    // Refresh cached subscription data for the subscription list page
    revalidateSubscriptionList();

    return response;
  } catch (error) {
    console.error("Unexpected error in deleteContent server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}
