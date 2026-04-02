import type { UpdateRecurringClassRequest } from "@shared/schemas/recurringClasses";
import { apiRequest } from "./client";

const BASE_ENDPOINT = "/recurring-classes";

// GET recurring classes by subscription id
export const getRecurringClassesBySubscriptionId = async (
  subscriptionId: number,
  status?: "active" | "history",
  cookie?: string,
): Promise<RecurringClasses> => {
  const params = new URLSearchParams({
    subscriptionId: subscriptionId.toString(),
  });

  if (status) {
    params.append("status", status);
  }

  return apiRequest<RecurringClasses>({
    method: "GET",
    backendEndpoint: `${BASE_ENDPOINT}?${params.toString()}`,
    cookie,
  });
};

export const getRecurringClassesHistoryCountBySubscriptionId = async (
  subscriptionId: number,
  cookie?: string,
): Promise<number> => {
  const params = new URLSearchParams({
    subscriptionId: subscriptionId.toString(),
  });

  const data = await apiRequest<{ count: number }>({
    method: "GET",
    backendEndpoint: `${BASE_ENDPOINT}/history-count?${params.toString()}`,
    cookie,
  });

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
  return apiRequest<{
    message: string;
    oldRecurringClass: RecurringClass;
    newRecurringClass: RecurringClass;
  }>({
    method: "PUT",
    backendEndpoint: `${BASE_ENDPOINT}/${recurringClassId}`,
    cookie,
    body: recurringClassData,
  });
};
