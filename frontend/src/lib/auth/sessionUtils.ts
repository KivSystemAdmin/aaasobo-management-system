import { auth } from "../../../auth.config";
import { INVALID_ADMIN_ID } from "@/lib/messages/adminDashboard";
import { INVALID_CUSTOMER_ID } from "@/lib/messages/customerDashboard";
import { INVALID_INSTRUCTOR_ID } from "@/lib/messages/instructorDashboard";

export async function getUserSession(userType?: UserType) {
  const session = await auth();

  if (!session) {
    return null;
  }

  if (userType && session.user.userType !== userType) {
    return null;
  }

  return session;
}

function throwInvalidUserError(userType: UserType) {
  switch (userType) {
    case "customer":
      throw new Error(INVALID_CUSTOMER_ID);
    case "instructor":
      throw new Error(INVALID_INSTRUCTOR_ID);
    case "admin":
      throw new Error(INVALID_ADMIN_ID);
    default:
      throw new Error("Invalid user type");
  }
}

export async function authenticateUserSession(userType: UserType) {
  const userSession = await getUserSession(userType);

  if (!userSession || userSession.user.userType !== userType) {
    console.error(`Invalid ${userType} session`);
    throwInvalidUserError(userType);
  }

  return userType;
}

export async function getAuthenticatedUserId(userType: UserType) {
  const userSession = await getUserSession(userType);
  const sessionUserId = userSession?.user.id;

  if (!sessionUserId) {
    console.error(`Missing authenticated ${userType} ID in session`);
    throwInvalidUserError(userType);
  }

  const userId = parseInt(sessionUserId!);
  if (Number.isNaN(userId)) {
    console.error(`Invalid authenticated ${userType} ID in session`);
    throwInvalidUserError(userType);
  }

  return userId;
}
