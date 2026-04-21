"use server";

import { updateUserPassword } from "@/lib/api/usersApi";
import { UNEXPECTED_ERROR_MESSAGE } from "@/lib/messages/formValidation";
import { extractPasswordResetValidationErrors } from "@/lib/utils/validationErrorUtils";
import {
  resetPasswordFormSchema,
  resetPasswordFormSchemaJa,
} from "@/schemas/authSchema";
import { getCookie } from "@/proxy";

export async function resetPassword(
  prevState: StringMessages | undefined,
  formData: FormData,
): Promise<StringMessages> {
  const token = formData.get("token");
  const userType = formData.get("userType");
  const password = formData.get("password");
  const passConfirmation = formData.get("passConfirmation");
  const passwordStrength = parseInt(
    formData.get("passwordStrength") as string,
    10,
  );
  const language = formData.get("language") as LanguageType;

  try {
    const schema =
      language === "ja" ? resetPasswordFormSchemaJa : resetPasswordFormSchema;

    const parsedForm = schema.safeParse({
      token,
      userType,
      password,
      passConfirmation,
      passwordStrength,
    });

    if (!parsedForm.success) {
      const formattedErrors = parsedForm.error.format();
      return extractPasswordResetValidationErrors(formattedErrors, language);
    }

    // Get the cookies from the request headers
    const cookie = await getCookie();

    const response = await updateUserPassword(
      parsedForm.data.token,
      parsedForm.data.userType,
      parsedForm.data.password,
      language,
      cookie,
    );

    return response;
  } catch (error) {
    console.error("Unexpected error in updateUserPassword action:", error);
    return {
      errorMessage: UNEXPECTED_ERROR_MESSAGE[language],
    };
  }
}
