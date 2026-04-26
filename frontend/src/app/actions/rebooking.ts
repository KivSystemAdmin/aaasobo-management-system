"use server";

import { rebookClass } from "@/lib/api/classesApi";
import { revalidateClassList, revalidateCustomerCalendar } from "./revalidate";
import { validateSession } from "./validateSession";
import { getCookie } from "@/proxy";

export async function rebookClassWithValidation({
  customerId,
  classId,
  dateTime,
  instructorId,
  childrenIds,
  userSessionType,
  language,
}: {
  customerId: number;
  classId: number;
  dateTime: string;
  instructorId: number;
  childrenIds: number[];
  userSessionType?: UserType;
  language: LanguageType;
}) {
  const { isValid, error } = await validateSession(customerId);

  if (!isValid) {
    return { error };
  }

  // Get the cookies from the request headers
  const cookie = await getCookie();

  const result = await rebookClass(
    classId,
    {
      dateTime,
      instructorId,
      customerId,
      childrenIds,
    },
    cookie,
  );

  if (!result.success) {
    return { error: result.errorMessage[language] };
  }
  ``;

  await revalidateCustomerCalendar(customerId, userSessionType);

  // Refresh cached class data for the class list page
  revalidateClassList();

  return { success: true };
}
