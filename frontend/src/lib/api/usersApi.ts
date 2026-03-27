import {
  CONFIRMATION_EMAIL_RESEND_FAILURE,
  EMAIL_NOT_REGISTERED_MESSAGE,
  EMAIL_VERIFICATION_RESENT_NOTICE,
  LOGIN_FAILED_MESSAGE,
  PASSWORD_RESET_EMAIL_SEND_FAILURE,
  PASSWORD_RESET_EMAIL_SENT_MESSAGE,
  PASSWORD_RESET_FAILED_MESSAGE,
  PASSWORD_RESET_LINK_EXPIRED,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  RESET_TOKEN_VERIFICATION_FAILED,
  TOKEN_OR_USER_NOT_FOUND_ERROR,
  UNEXPECTED_ERROR_MESSAGE,
} from "../messages/formValidation";
import type {
  SendPasswordResetRequest,
  VerifyResetTokenRequest,
  UpdatePasswordRequest,
} from "@shared/schemas/users";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";

export const sendUserResetEmail = async (
  email: string,
  userType: UserType,
  language: LanguageType,
): Promise<ForgotPasswordFormState> => {
  try {
    const apiURL = `${BACKEND_ORIGIN}/users/send-password-reset`;
    const method = "POST";
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({
      email,
      userType,
    } as SendPasswordResetRequest);
    const response = await fetch(apiURL, {
      method,
      headers,
      body,
    });
    const statusErrorMessages: Record<number, string> = {
      404: EMAIL_NOT_REGISTERED_MESSAGE[language],
      503: PASSWORD_RESET_EMAIL_SEND_FAILURE[language],
    };

    const errorMessage = statusErrorMessages[response.status];
    if (errorMessage) {
      return { errorMessage };
    }

    if (![200, 201].includes(response.status)) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    return {
      successMessage: PASSWORD_RESET_EMAIL_SENT_MESSAGE[language],
    };
  } catch (error) {
    console.error("API error while sending password reset email:", error);
    return {
      errorMessage: UNEXPECTED_ERROR_MESSAGE[language],
    };
  }
};

export const updateUserPassword = async (
  token: string,
  userType: UserType,
  password: string,
  language: LanguageType,
  cookie: string,
): Promise<StringMessages> => {
  try {
    // From server component
    const apiURL = `${BACKEND_ORIGIN}/users/update-password`;
    const method = "PATCH";
    const headers = { "Content-Type": "application/json", Cookie: cookie };
    const body = JSON.stringify({
      token,
      userType,
      password,
    } as UpdatePasswordRequest);
    const response = await fetch(apiURL, {
      method,
      headers,
      body,
    });

    if (response.status === 410) {
      return {
        errorMessageWithResetLink: PASSWORD_RESET_LINK_EXPIRED[language],
      };
    }

    if (response.status === 404) {
      return { errorMessage: TOKEN_OR_USER_NOT_FOUND_ERROR[language] };
    }

    if (response.status !== 200) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    return {
      successMessage: PASSWORD_RESET_SUCCESS_MESSAGE[language],
    };
  } catch (error) {
    console.error("API error while updating password:", error);
    return {
      errorMessageWithResetLink: PASSWORD_RESET_FAILED_MESSAGE[language],
    };
  }
};

export const verifyResetToken = async (
  token: string,
  userType: UserType,
): Promise<TokenVerificationResult> => {
  try {
    const apiURL = `${BACKEND_ORIGIN}/users/verify-reset-token`;
    const method = "POST";
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ token, userType } as VerifyResetTokenRequest);
    const response = await fetch(apiURL, {
      method,
      headers,
      body,
    });

    if (response.status === 404) {
      return {
        valid: false,
        needsResetLink: false,
        message: TOKEN_OR_USER_NOT_FOUND_ERROR,
      };
    }

    if (response.status === 410) {
      return {
        valid: false,
        needsResetLink: true,
        message: PASSWORD_RESET_LINK_EXPIRED,
      };
    }

    if (response.status !== 200) {
      throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
    }

    return {
      valid: true,
      needsResetLink: false,
      message: { ja: "有効なトークン", en: "valid token" },
    };
  } catch (error) {
    console.error("API error while verifying password reset token:", error);
    return {
      valid: false,
      needsResetLink: true,
      message: RESET_TOKEN_VERIFICATION_FAILED,
    };
  }
};
