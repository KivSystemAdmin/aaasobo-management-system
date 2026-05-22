import { Response } from "express";
import { deletePastAdmins } from "../services/adminsService";
import {
  deleteCustomer,
  deletePastCustomers,
  getCustomerByEmail,
  getCustomerById,
  registerCustomer,
  updateCustomerProfile,
  verifyCustomerEmail,
} from "../services/customersService";
import {
  getSubscriptionsById,
  createNewSubscription,
} from "../services/subscriptionsService";
import { getWeeklyClassTimes } from "../services/plansService";
import { createNewRecurringClass } from "../services/recurringClassesService";
import {
  createFreeTrialClass,
  declineFreeTrialClass,
  getCustomerClasses,
  getRebookableClasses,
  getUpcomingClasses,
} from "../services/classesService";
import {
  deleteVerificationToken,
  generateVerificationToken,
  getVerificationTokenByToken,
} from "../services/verificationTokensService";
import {
  resendVerificationEmail,
  sendVerificationEmail,
} from "../lib/email/mail";
import { prisma } from "../../prisma/prismaClient";
import { deleteChild, registerChild } from "../services/childrenService";
import { getChildProfiles } from "../services/childrenService";
import { convertToISOString, convertToTimezoneDate } from "../utils/dateUtils";
import {
  RequestWithParams,
  RequestWithBody,
  RequestWith,
} from "../middlewares/validationMiddleware";
import type {
  CustomerIdParams,
  RegisterCustomerRequest,
  UpdateCustomerProfileRequest,
  RegisterSubscriptionRequest,
  VerifyEmailRequest,
  CheckEmailConflictsRequest,
  DeclineFreeTrialRequest,
} from "../../../shared/schemas/customers";

export const registerCustomerController = async (
  req: RequestWithBody<RegisterCustomerRequest>,
  res: Response,
) => {
  const { customerData, childData } = req.body;

  const { email, password, prefecture } = customerData;
  const { birthdate, personalInfo } = childData;

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingCustomer = await getCustomerByEmail(normalizedEmail);
    if (existingCustomer) {
      return res.sendStatus(409);
    }

    const { customer, child, verificationToken } = await prisma.$transaction(
      async (tx) => {
        const customer = await registerCustomer(
          {
            name: customerData.name,
            email: normalizedEmail,
            password,
            prefecture,
          },
          tx,
        );

        const child = await registerChild(
          childData.name,
          convertToISOString(birthdate),
          personalInfo,
          customer.id,
          tx,
        );

        const verificationToken = await generateVerificationToken(
          normalizedEmail,
          tx,
        );

        // Create a free trial class
        await createFreeTrialClass({ tx, customerId: customer.id });

        return { customer, child, verificationToken };
      },
    );

    const sendResult = await sendVerificationEmail(
      verificationToken.email,
      customer.name,
      verificationToken.token,
    );

    if (!sendResult.success) {
      await prisma.$transaction(async (tx) => {
        await deleteChild(tx, child.id);
        await deleteCustomer(customer.id, tx);
        await deleteVerificationToken(normalizedEmail, tx);
      });
      return res.sendStatus(503); // Failed to send password reset email. 503 Service Unavailable
    }

    res.sendStatus(201);
  } catch (error) {
    console.error("Error registering customer", {
      error,
      context: {
        email: normalizedEmail,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const getSubscriptionsByIdController = async (
  req: RequestWithParams<CustomerIdParams>,
  res: Response,
) => {
  const customerId = req.params.id;

  try {
    const subscriptions = await getSubscriptionsById(customerId);

    res.json({ subscriptions });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

export const getCustomerByIdController = async (
  req: RequestWithParams<CustomerIdParams>,
  res: Response,
) => {
  const customerId = req.params.id;

  try {
    const customer = await getCustomerById(customerId);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    // Convert terminationAt from UTC to JST
    const terminationAt = customer.terminationAt
      ? convertToTimezoneDate(customer.terminationAt, "Asia/Tokyo")
      : null;

    res.json({ ...customer, terminationAt });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    });
  }
};

export const updateCustomerProfileController = async (
  req: RequestWith<CustomerIdParams, UpdateCustomerProfileRequest>,
  res: Response,
) => {
  const customerId = req.params.id;
  const { name, email, prefecture } = req.body;
  const updatedEmail = email.trim().toLowerCase();

  try {
    const currentCustomerProfile = await getCustomerById(customerId);

    if (!currentCustomerProfile) {
      return res.sendStatus(404);
    }

    const isNameUpdated = name !== currentCustomerProfile.name;
    const isEmailUpdated = updatedEmail !== currentCustomerProfile.email;
    const isPrefectureUpdated =
      prefecture !== currentCustomerProfile.prefecture;

    if (isEmailUpdated) {
      const existingCustomer = await getCustomerByEmail(updatedEmail);
      if (existingCustomer) {
        return res.sendStatus(409); // Conflict: email already registered
      }

      const verificationToken = await generateVerificationToken(updatedEmail);

      const resendResult = await resendVerificationEmail(
        verificationToken.email,
        name,
        verificationToken.token,
      );

      if (!resendResult.success) {
        await deleteVerificationToken(verificationToken.email);
        return res.sendStatus(503); // Service Unavailable:failed to resend verification email
      }
    }

    await updateCustomerProfile(customerId, {
      ...(isNameUpdated && { name }),
      ...(isEmailUpdated && { email: updatedEmail }),
      ...(isPrefectureUpdated && { prefecture }),
      ...(isEmailUpdated && { emailVerified: null }),
    });

    res.status(200).json({
      isEmailUpdated,
    });
  } catch (error) {
    console.error("Error updating customer profile", {
      error,
      context: {
        customerId,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const registerSubscriptionController = async (
  req: RequestWith<CustomerIdParams, RegisterSubscriptionRequest>,
  res: Response,
) => {
  const customerId = req.params.id;
  const { planId, startAt, selectType } = req.body;

  try {
    // Get weekly class times based on plan id.
    const data = await getWeeklyClassTimes(planId);
    if (!data) {
      res.status(404).json({ error: "Weekly class times not found" });
      return;
    }
    const { weeklyClassTimes } = data;

    // Create new subscription record.
    const subscriptionData = {
      planId,
      customerId,
      startAt: new Date(startAt),
      selectType,
    };
    const newSubscription = await createNewSubscription(subscriptionData);
    if (!newSubscription) {
      res.status(500).json({ error: "Failed to create subscription" });
      return;
    }
    const subscriptionId = newSubscription.id;

    await prisma.$transaction(async (tx) => {
      // Create the same number of recurring class records as weekly class times
      for (let i = 0; i < weeklyClassTimes; i++) {
        const newRecurringClass = await createNewRecurringClass(
          tx,
          subscriptionId,
        );
        if (!newRecurringClass) {
          res.status(500).json({ error: "Failed to create recurring class" });
          return;
        }
      }
    });

    res.status(200).json({ newSubscription });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getRebookableClassesController = async (
  req: RequestWithParams<CustomerIdParams>,
  res: Response,
) => {
  const customerId = req.params.id;

  try {
    const rebookableClasses = await getRebookableClasses(customerId);
    res.status(200).json(rebookableClasses);
  } catch (error) {
    console.error(
      `Error while getting rebookable classes (customer ID: ${customerId}):`,
      error,
    );
    res.sendStatus(500);
  }
};

export const getUpcomingClassesController = async (
  req: RequestWithParams<CustomerIdParams>,
  res: Response,
) => {
  const customerId = req.params.id;

  try {
    const upcomingClasses = await getUpcomingClasses(customerId);
    res.status(200).json(upcomingClasses);
  } catch (error) {
    console.error(
      `Error while getting upcoming classes (customer ID: ${customerId}):`,
      error,
    );
    res.sendStatus(500);
  }
};

export const getClassesController = async (
  req: RequestWithParams<CustomerIdParams>,
  res: Response,
) => {
  const customerId = req.params.id;

  try {
    const classes = await getCustomerClasses(customerId);
    res.status(200).json(classes);
  } catch (error) {
    console.error(
      `Error while getting customer classes (customer ID: ${customerId}):`,
      error,
    );
    res.sendStatus(500);
  }
};

export const verifyCustomerEmailController = async (
  req: RequestWithBody<VerifyEmailRequest>,
  res: Response,
) => {
  const { token } = req.body;

  try {
    const existingToken = await getVerificationTokenByToken(token);

    if (!existingToken) {
      return res.sendStatus(404);
    }

    const existingCustomer = await getCustomerByEmail(existingToken.email);

    if (!existingCustomer) {
      return res.sendStatus(404);
    }

    // This is for cases where a customer who has already been verified clicks the email link again.
    if (existingCustomer.emailVerified) {
      return res.sendStatus(200);
    }

    const isTokenExpired = new Date(existingToken.expires) < new Date();

    if (isTokenExpired) {
      return res.sendStatus(410); // 410 Gone
    }

    await verifyCustomerEmail(existingCustomer.id, existingToken.email);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error verifying customer email", {
      error,
      context: {
        token,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const checkEmailConflictsController = async (
  req: RequestWithBody<CheckEmailConflictsRequest>,
  res: Response,
) => {
  const { email } = req.body;

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingCustomer = await getCustomerByEmail(normalizedEmail);
    if (existingCustomer) {
      return res.sendStatus(409);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error checking email conflicts", {
      error,
      context: {
        email: normalizedEmail,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const getChildProfilesController = async (
  req: RequestWithParams<CustomerIdParams>,
  res: Response,
) => {
  const customerId = req.params.id;

  try {
    const childProfiles = await getChildProfiles(customerId);
    res.status(200).json(childProfiles);
  } catch (error) {
    console.error("Error getting child profiles by customer ID", {
      error,
      context: {
        customerId,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const markWelcomeSeenController = async (
  req: RequestWithParams<CustomerIdParams>,
  res: Response,
) => {
  const customerId = req.params.id;

  try {
    await updateCustomerProfile(customerId, { hasSeenWelcome: true });
    res.sendStatus(200);
  } catch (error) {
    console.error("Error marking welcome message as seen", {
      error,
      context: {
        customerId,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const declineFreeTrialClassController = async (
  req: RequestWith<CustomerIdParams, DeclineFreeTrialRequest>,
  res: Response,
) => {
  const customerId = req.params.id;
  const { classCode } = req.body;

  try {
    const updatedClass = await declineFreeTrialClass(customerId, classCode);

    if (updatedClass.count === 0) {
      return res.sendStatus(404);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error declining free trial class", {
      error,
      context: {
        customerId,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

// Delete customers who have left the service more than 3 years ago
export const deletePastCustomersController = async (
  _: Request,
  res: Response,
) => {
  try {
    const deletedCustomers = await deletePastCustomers();
    res.status(200).json({ deletedCustomers });
  } catch (error) {
    console.error("Error deleting past customers", {
      error,
      context: {
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};
