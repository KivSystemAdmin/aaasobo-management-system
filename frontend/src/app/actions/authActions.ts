"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "../../../auth.config";
import { userLoginSchema } from "@/schemas/authSchema";
import { extractLoginValidationErrors } from "@/lib/utils/validationErrorUtils";
import { UNEXPECTED_ERROR_MESSAGE } from "@/lib/messages/formValidation";
import { LOGIN_FAILED_MESSAGE } from "@/lib/messages/formValidation";

export async function authenticate(
  prevState: { errorMessage: string } | undefined,
  formData: FormData,
): Promise<{ errorMessage: string } | undefined> {
  const email = formData.get("email");
  const password = formData.get("password");
  const userType = formData.get("userType");
  const language = formData.get("language") as LanguageType;

  try {
    const parsedForm = userLoginSchema.safeParse({
      email,
      password,
      userType,
    });

    if (!parsedForm.success) {
      const validationErrors = parsedForm.error.issues;
      return extractLoginValidationErrors(validationErrors, language);
    }

    await signIn("credentials", {
      email: parsedForm.data.email,
      password: parsedForm.data.password,
      userType: parsedForm.data.userType,
      redirectTo: "/auth/post-login",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      console.error("Error in authenticate server action:", error);
      return {
        errorMessage:
          error.type === "CredentialsSignin"
            ? LOGIN_FAILED_MESSAGE[language]
            : UNEXPECTED_ERROR_MESSAGE[language],
      };
    }
    // Re-throw non-auth errors so that Next.js can handle redirects properly.
    throw error;
  }
}

export async function logout(userType: UserType) {
  await signOut({ redirectTo: `/${userType}s/login` });
}
