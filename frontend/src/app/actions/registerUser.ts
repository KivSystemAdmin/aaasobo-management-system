"use server";

import { registerInstructor } from "@/lib/api/instructorsApi";
import { registerAdmin } from "@/lib/api/adminsApi";
import { GENERAL_ERROR_MESSAGE } from "@/lib/messages/formValidation";
import { extractRegisterValidationErrors } from "@/lib/utils/validationErrorUtils";
import {
  instructorRegisterSchema,
  instructorIconRegisterSchema,
  adminRegisterSchema,
} from "@/schemas/authSchema";
import { revalidateInstructorList, revalidateAdminList } from "./revalidate";
import { getCookie } from "../../proxy";

export async function registerUser(
  prevState: RegisterFormState | undefined,
  formData: FormData,
): Promise<RegisterFormState> {
  try {
    const name = formData.get("name");
    const nickname = formData.get("nickname");
    const email = formData.get("email");
    const password = formData.get("password");
    const passConfirmation = formData.get("passConfirmation");
    const icon = formData.get("icon") as File;
    const birthdate = String(formData.get("birthdate"));
    const workingTime = String(formData.get("workingTime"));
    const lifeHistory = String(formData.get("lifeHistory"));
    const favoriteFood = String(formData.get("favoriteFood"));
    const hobby = String(formData.get("hobby"));
    const messageForChildren = String(formData.get("messageForChildren"));
    const skill = String(formData.get("skill"));
    const classURL = formData.get("classURL");
    const meetingId = formData.get("meetingId");
    const englishBackground = Number(formData.get("englishBackground"));
    const passcode = formData.get("passcode");
    const passwordStrength = parseInt(
      formData.get("passwordStrength") as string,
      10,
    );
    const userType = formData.get("userType");

    // Get the cookies from the request headers
    const cookie = await getCookie();

    let parsedForm;
    let parsedForm1;
    let parsedForm2;
    let validationErrors;
    let response;

    switch (userType) {
      case "instructor":
        parsedForm1 = instructorRegisterSchema.safeParse({
          name,
          nickname,
          email,
          password,
          passConfirmation,
          passwordStrength,
          icon,
          classURL,
          meetingId,
          passcode,
          userType,
          englishBackground,
        });
        if (!parsedForm1.success) {
          const validationErrors = parsedForm1.error.issues;
          return extractRegisterValidationErrors(validationErrors);
        }

        const userData = new FormData();
        userData.append("name", parsedForm1.data.name);
        userData.append("nickname", parsedForm1.data.nickname);
        userData.append("email", parsedForm1.data.email);
        userData.append("password", parsedForm1.data.password);
        userData.append("birthdate", birthdate);
        userData.append("workingTime", workingTime);
        userData.append("lifeHistory", lifeHistory);
        userData.append("favoriteFood", favoriteFood);
        userData.append("hobby", hobby);
        userData.append("messageForChildren", messageForChildren);
        userData.append("skill", skill);
        userData.append("classURL", parsedForm1.data.classURL);
        userData.append("meetingId", parsedForm1.data.meetingId);
        userData.append("passcode", parsedForm1.data.passcode);
        userData.append(
          "englishBackground",
          parsedForm1.data.englishBackground.toString(),
        );

        // Append the icon file if it exists
        if (icon.name && icon.size > 0) {
          parsedForm2 = instructorIconRegisterSchema.safeParse({
            icon,
          });
          if (!parsedForm2.success) {
            validationErrors = parsedForm2.error.issues;
            return extractRegisterValidationErrors(validationErrors);
          }

          userData.append("icon", parsedForm2.data.icon);
        }

        response = await registerInstructor(userData, cookie);

        // Refresh cached instructor data for the instructor list page
        revalidateInstructorList();

        return response;

      case "admin":
        parsedForm = adminRegisterSchema.safeParse({
          name,
          email,
          password,
          passConfirmation,
          passwordStrength,
          userType,
        });
        if (!parsedForm.success) {
          const validationErrors = parsedForm.error.issues;
          return extractRegisterValidationErrors(validationErrors);
        }

        response = await registerAdmin({
          name: parsedForm.data.name,
          email: parsedForm.data.email,
          password: parsedForm.data.password,
          cookie,
        });

        // Refresh cached admin data for the admin list page
        await revalidateAdminList();

        return response;

      default:
        return {
          errorMessage: "Invalid user type.",
        };
    }
  } catch (error) {
    console.error("Unexpected error in registerUser server action:", error);
    return {
      errorMessage: GENERAL_ERROR_MESSAGE,
    };
  }
}
