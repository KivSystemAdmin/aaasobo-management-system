"use server";

import { updateAdmin } from "@/lib/api/adminsApi";
import { updateInstructor } from "@/lib/api/instructorsApi";
import { GENERAL_ERROR_MESSAGE } from "@/lib/messages/formValidation";
import {
  extractProfileUpdateErrors,
  extractUpdateValidationErrors,
} from "@/lib/utils/validationErrorUtils";
import {
  adminUpdateSchema,
  instructorUpdateSchema,
  instructorIconUpdateSchema,
} from "@/schemas/authSchema";
import { revalidateAdminList, revalidateInstructorList } from "./revalidate";
import { getCookie } from "../../proxy";
import {
  childProfileSchema,
  customerProfileSchema,
} from "@/schemas/customerDashboardSchemas";
import { updateCustomerProfile } from "@/lib/api/customersApi";
import { revalidatePath } from "next/cache";
import {
  LOGIN_REQUIRED_MESSAGE,
  NO_CHANGES_MADE_MESSAGE,
} from "@/lib/messages/customerDashboard";
import { getUserSession } from "@/lib/auth/sessionUtils";
import { addChild, updateChildProfile } from "@/lib/api/childrenApi";

export async function updateAdminAction(
  prevState: UpdateFormState | undefined,
  formData: FormData,
): Promise<UpdateFormState> {
  try {
    const name = formData.get("name");
    const email = formData.get("email");
    // Hidden input tag fields
    const id = Number(formData.get("id"));

    const parsedForm = adminUpdateSchema.safeParse({
      name,
      email,
    });

    if (!parsedForm.success) {
      const validationErrors = parsedForm.error.issues;
      return extractUpdateValidationErrors(validationErrors);
    }

    // Get the cookies from the request headers
    const cookie = await getCookie();

    const response = await updateAdmin(
      id,
      { name: parsedForm.data.name, email: parsedForm.data.email },
      cookie,
    );

    // Refresh cached admin data for the admin list page
    revalidateAdminList();

    return response;
  } catch (error) {
    console.error("Unexpected error in updateUser server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}

export async function updateInstructorAction(
  prevState: UpdateFormState | undefined,
  formData: FormData,
): Promise<UpdateFormState> {
  try {
    const name = formData.get("name");
    const leavingDate = String(formData.get("leavingDate"));
    const nickname = formData.get("nickname");
    const birthdate = String(formData.get("birthdate"));
    const workingTime = String(formData.get("workingTime"));
    const lifeHistory = String(formData.get("lifeHistory"));
    const favoriteFood = String(formData.get("favoriteFood"));
    const hobby = String(formData.get("hobby"));
    const messageForChildren = String(formData.get("messageForChildren"));
    const skill = String(formData.get("skill"));
    const email = formData.get("email");
    const classURL = formData.get("classURL");
    const meetingId = formData.get("meetingId");
    const passcode = formData.get("passcode");
    const icon = formData.get("icon") as File;
    const englishBackground = Number(formData.get("englishBackground"));
    // Hidden input tag fields
    const id = Number(formData.get("id"));
    const confirmResult = formData.get("confirmResult");

    if (confirmResult === "false") {
      return {
        skipProcessing: "Skipping update due to confirmation failure",
      };
    }

    let validationErrors;

    const parsedForm1 = instructorUpdateSchema.safeParse({
      name,
      nickname,
      email,
      classURL,
      meetingId,
      passcode,
      englishBackground,
    });

    if (!parsedForm1.success) {
      validationErrors = parsedForm1.error.issues;
      return extractUpdateValidationErrors(validationErrors);
    }

    // Get the cookies from the request headers
    const cookie = await getCookie();

    const userData = new FormData();
    userData.append("name", parsedForm1.data.name);
    userData.append("leavingDate", leavingDate);
    userData.append("nickname", parsedForm1.data.nickname);
    userData.append("birthdate", birthdate);
    userData.append("workingTime", workingTime);
    userData.append("lifeHistory", lifeHistory);
    userData.append("favoriteFood", favoriteFood);
    userData.append("hobby", hobby);
    userData.append("messageForChildren", messageForChildren);
    userData.append("skill", skill);
    userData.append("email", parsedForm1.data.email);
    userData.append("classURL", parsedForm1.data.classURL);
    userData.append("meetingId", parsedForm1.data.meetingId);
    userData.append("passcode", parsedForm1.data.passcode);
    userData.append(
      "englishBackground",
      parsedForm1.data.englishBackground.toString(),
    );

    // Append the icon file if it exists
    if (icon.name && icon.size > 0) {
      const parsedForm2 = instructorIconUpdateSchema.safeParse({
        icon,
      });

      if (!parsedForm2.success) {
        validationErrors = parsedForm2.error.issues;
        return extractUpdateValidationErrors(validationErrors);
      }

      userData.append("icon", parsedForm2.data.icon);
    }

    const response = await updateInstructor(id, userData, cookie);

    // Refresh cached instructor data for the instructor list page
    revalidateInstructorList();

    return response;
  } catch (error) {
    console.error("Unexpected error in updateUser server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}

export async function updateCustomerProfileAction(
  prevState: LocalizedMessages | undefined,
  formData: FormData,
): Promise<LocalizedMessages> {
  const updatedName = formData.get("name");
  const updatedEmail = formData.get("email");
  const updatedPrefecture = formData.get("prefecture");
  // Hidden input tag fields
  const currentName = formData.get("currentName");
  const currentEmail = formData.get("currentEmail");
  const currentPrefecture = formData.get("currentPrefecture");
  const id = Number(formData.get("id")); // The form includes "id" (customer ID) only when submitted by an admin.

  let customerId;

  // If "id" is present (only submitted by an admin), use it as the customerId.
  // Otherwise, retrieve the customer ID from the session for security.
  if (id) {
    customerId = id;
  } else {
    const session = await getUserSession("customer");

    if (!session) {
      throw new Error("Unauthorized / 認証されていません");
    }

    customerId = Number(session.user.id);
  }

  // Get the admin ID from the session if the action is admin authenticated
  const session = await getUserSession("admin");
  const adminId = session?.user.id ? parseInt(session.user.id) : undefined;

  // Check if there are any changes
  if (
    updatedName === currentName &&
    updatedEmail === currentEmail &&
    updatedPrefecture === currentPrefecture
  ) {
    return {
      errorMessage: NO_CHANGES_MADE_MESSAGE,
    };
  }

  const parsedForm = customerProfileSchema.safeParse({
    name: updatedName,
    email: updatedEmail,
    prefecture: updatedPrefecture,
  });

  if (!parsedForm.success) {
    const validationErrors = parsedForm.error.issues;
    return extractProfileUpdateErrors(validationErrors);
  }

  // Get the cookies from the request headers
  const cookie = await getCookie();

  const updateResultMessage = await updateCustomerProfile(
    customerId,
    parsedForm.data.name,
    parsedForm.data.email,
    parsedForm.data.prefecture,
    cookie,
  );

  const path = id
    ? `/admins/${adminId}/customer-list/${customerId}`
    : `/customers/${customerId}/profile`;

  revalidatePath(path);

  return updateResultMessage;
}

export async function updateChildProfileAction(
  prevState: LocalizedMessages | undefined,
  formData: FormData,
): Promise<LocalizedMessages> {
  const name = formData.get("name");
  const birthdate = formData.get("birthdate");
  const personalInfo = formData.get("personalInfo");
  // Hidden input tag fields
  const id = Number(formData.get("id"));
  const customerIdFromForm = Number(formData.get("customerId")); // The form includes "customerId" only when submitted by an admin.

  const session = await getUserSession();

  if (!session || session.user.userType === "instructor") {
    return { errorMessage: LOGIN_REQUIRED_MESSAGE };
  }

  const loggedInUserId = Number(session.user.id);
  const loggedInUserType = session.user.userType;

  const customerId =
    loggedInUserType === "customer" ? loggedInUserId : customerIdFromForm;

  const parsedForm = childProfileSchema.safeParse({
    name,
    birthdate,
    personalInfo,
  });

  if (!parsedForm.success) {
    const validationErrors = parsedForm.error.issues;
    return extractProfileUpdateErrors(validationErrors);
  }

  // Get the cookies from the request headers
  const cookie = await getCookie();

  const updateResultMessage = await updateChildProfile(
    id,
    parsedForm.data.name,
    parsedForm.data.birthdate,
    parsedForm.data.personalInfo,
    customerId,
    cookie,
  );

  const path =
    loggedInUserType === "admin"
      ? `/admins/${loggedInUserId}/customer-list/${customerId}`
      : `/customers/${loggedInUserId}/children-profiles`;

  revalidatePath(path);

  return updateResultMessage;
}

export async function addChildProfileAction(
  prevState: LocalizedMessages | undefined,
  formData: FormData,
): Promise<LocalizedMessages> {
  const name = formData.get("name");
  const birthdate = formData.get("birthdate");
  const personalInfo = formData.get("personalInfo");
  // Hidden input tag fields
  const customerIdFromForm = Number(formData.get("customerId")); // The form includes "customerId" only when submitted by an admin.

  const session = await getUserSession();

  if (!session || session.user.userType === "instructor") {
    return { errorMessage: LOGIN_REQUIRED_MESSAGE };
  }

  const loggedInUserId = Number(session.user.id);
  const loggedInUserType = session.user.userType;

  const customerId =
    loggedInUserType === "customer" ? loggedInUserId : customerIdFromForm;

  const parsedForm = childProfileSchema.safeParse({
    name,
    birthdate,
    personalInfo,
  });

  if (!parsedForm.success) {
    const validationErrors = parsedForm.error.issues;
    return extractProfileUpdateErrors(validationErrors);
  }

  // Get the cookies from the request headers
  const cookie = await getCookie();

  const resultMessage = await addChild(
    parsedForm.data.name,
    parsedForm.data.birthdate,
    parsedForm.data.personalInfo,
    customerId,
    cookie,
  );

  const path =
    loggedInUserType === "admin"
      ? `/admins/${loggedInUserId}/customer-list/${customerId}`
      : `/customers/${loggedInUserId}/children-profiles`;

  revalidatePath(path);

  return resultMessage;
}
