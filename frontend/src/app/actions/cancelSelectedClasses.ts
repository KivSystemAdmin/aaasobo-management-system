"use server";

import { revalidatePath } from "next/cache";
import { cancelClass, cancelClasses } from "@/lib/api/classesApi";
import { getUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";
import { revalidateClassList } from "./revalidate";

export const cancelSelectedClasses = async (
  classesToCancel: number[],
  customerId: number,
  userSessionType?: UserType,
) => {
  // Check if the user is authenticated and has the right permissions
  const session = await getUserSession();
  if (!session) {
    throw new Error("Unauthorized / 認証されていません");
  }

  let adminId;

  if (session.user.userType === "customer") {
    if (Number(session.user.id) !== customerId) {
      throw new Error("Unauthorized / 認証されていません");
    }
  } else if (session.user.userType === "admin") {
    adminId = Number(session.user.id);
    if (!adminId && userSessionType === "admin") {
      throw new Error("Admin ID is required for authenticated admin actions.");
    }
  } else {
    throw new Error("Unauthorized user type");
  }

  // Determine the path to revalidate based on whether the action is admin authenticated
  const path =
    userSessionType === "admin"
      ? `/admins/customer-list/${customerId}`
      : "/customers/classes";

  // Get the cookies from the request headers
  const cookie = await getCookie();

  const cancelationResult = await cancelClasses(classesToCancel, cookie);

  if (cancelationResult.success) {
    revalidatePath(path);
    revalidateClassList();
  }

  return cancelationResult;
};

export const cancelClassAction = async (
  classId: number,
  customerId: number,
  userSessionType?: UserType,
) => {
  // Check if the user is authenticated and has the right permissions
  const session = await getUserSession();
  if (!session) {
    throw new Error("Unauthorized / 認証されていません");
  }

  let adminId;

  if (session.user.userType === "customer") {
    if (Number(session.user.id) !== customerId) {
      throw new Error("Unauthorized / 認証されていません");
    }
  } else if (session.user.userType === "admin") {
    adminId = Number(session.user.id);
    if (!adminId) {
      throw new Error("Admin ID is required for authenticated admin actions.");
    }
  } else {
    throw new Error("Unauthorized user type");
  }

  // Determine the path to revalidate based on whether the action is admin authenticated
  const path =
    userSessionType === "admin"
      ? `/admins/customer-list/${customerId}`
      : "/customers/classes";

  // Get the cookies from the request headers
  const cookie = await getCookie();

  const cancelationResult = await cancelClass(classId, cookie);

  if (cancelationResult.success) {
    revalidatePath(path);
    revalidateClassList();
  }

  return cancelationResult;
};
