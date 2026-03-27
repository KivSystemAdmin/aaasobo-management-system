import { Response } from "express";
import bcrypt from "bcrypt";
import { RequestWithBody } from "../middlewares/validationMiddleware";
import {
  getAdminByEmail,
  updateAdminPassword,
} from "../services/adminsService";
import {
  getCustomerByEmail,
  updateCustomerPassword,
} from "../services/customersService";
import {
  getInstructorByEmail,
  updateInstructorPassword,
} from "../services/instructorsService";
import {
  deleteVerificationToken,
  generateVerificationToken,
} from "../services/verificationTokensService";
import {
  resendVerificationEmail,
  sendPasswordResetEmail,
  UserType,
} from "../lib/email/mail";
import {
  deletePasswordResetToken,
  generatePasswordResetToken,
  getPasswordResetTokenByToken,
} from "../services/passwordResetTokensService";
import { hashPassword } from "../utils/commonUtils";
import { Customer } from "../../generated/prisma";
import {
  AuthenticateRequest,
  SendPasswordResetRequest,
  VerifyResetTokenRequest,
  UpdatePasswordRequest,
} from "../../../shared/schemas/users";

const getUserByEmail = async (userType: UserType, email: string) => {
  switch (userType) {
    case "admin":
      return getAdminByEmail(email);
    case "customer":
      return getCustomerByEmail(email);
    case "instructor":
      return getInstructorByEmail(email);
  }
};

export const authenticateUserController = async (
  req: RequestWithBody<AuthenticateRequest>,
  res: Response,
) => {
  const { email, password, userType } = req.body;

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await getUserByEmail(userType, normalizedEmail);

    if (!user) {
      return res.sendStatus(401);
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return res.sendStatus(401);
    }

    // Email verification is only required for customers.
    if (userType === "customer") {
      const customer = user as Customer;

      // Resend email to verify the registered email address if it is not verified yet.
      if (!customer.emailVerified) {
        const verificationToken =
          await generateVerificationToken(normalizedEmail);

        const resendResult = await resendVerificationEmail(
          verificationToken.email,
          user.name,
          verificationToken.token,
        );

        if (!resendResult.success) {
          await deleteVerificationToken(normalizedEmail);
          return res.sendStatus(503); // Failed to resend verification email. 503 Service Unavailable
        }

        return res.sendStatus(403); // Email is not verified yet. 403 Forbidden
      }
    }

    res.status(200).json({ id: user.id });
  } catch (error) {
    console.error("Error authenticating user", {
      error,
      context: {
        email: normalizedEmail,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const sendUserResetEmailController = async (
  req: RequestWithBody<SendPasswordResetRequest>,
  res: Response,
) => {
  const { email, userType } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await getUserByEmail(userType, normalizedEmail);

    if (!user) {
      return res.sendStatus(404);
    }

    const passwordResetToken = await generatePasswordResetToken(user.email);

    const sendResult = await sendPasswordResetEmail(
      passwordResetToken.email,
      user.name,
      passwordResetToken.token,
      userType,
    );

    if (!sendResult.success) {
      await deletePasswordResetToken(passwordResetToken.email);
      return res.sendStatus(503); // Failed to send password reset email. 503 Service Unavailable
    }

    return res.sendStatus(201);
  } catch (error) {
    console.error("Error sending password reset email", {
      error,
      context: {
        email: normalizedEmail,
        userType,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const updatePasswordController = async (
  req: RequestWithBody<UpdatePasswordRequest>,
  res: Response,
) => {
  const { token, userType, password } = req.body;

  try {
    const existingToken = await getPasswordResetTokenByToken(token);
    if (!existingToken) {
      return res.sendStatus(404);
    }

    const user = await getUserByEmail(userType, existingToken.email);
    if (!user) {
      return res.sendStatus(404);
    }

    const isTokenExpired = new Date(existingToken.expires) < new Date();

    if (isTokenExpired) {
      return res.sendStatus(410); // Token is expired. 410 Gone
    }

    const hashedPassword = await hashPassword(password);

    switch (userType) {
      case "admin":
        await updateAdminPassword(user.id, hashedPassword);
        break;
      case "customer":
        await updateCustomerPassword(user.id, hashedPassword);
        break;
      case "instructor":
        await updateInstructorPassword(user.id, hashedPassword);
        break;
    }

    return res.sendStatus(201);
  } catch (error) {
    console.error("Error updating password", {
      error: error instanceof Error ? error.message : "unknown_error",
      context: {
        userType,
        tokenPresent: Boolean(token),
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const verifyResetTokenController = async (
  req: RequestWithBody<VerifyResetTokenRequest>,
  res: Response,
) => {
  const { token, userType } = req.body;

  try {
    const existingToken = await getPasswordResetTokenByToken(token);
    if (!existingToken) {
      return res.sendStatus(404);
    }

    const user = await getUserByEmail(userType, existingToken.email);
    if (!user) {
      return res.sendStatus(404);
    }

    const isTokenExpired = new Date(existingToken.expires) < new Date();

    if (isTokenExpired) {
      return res.sendStatus(410); // Token is expired. 410 Gone
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error verifying password reset token", {
      error,
      context: {
        token,
        userType,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};
