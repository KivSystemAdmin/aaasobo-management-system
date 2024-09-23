import { Request, Response } from "express";
import { prisma } from "../../prisma/prismaClient";
import {
  fetchCustomerById,
  updateCustomer,
} from "../services/customersService";
import {
  getSubscriptionsById,
  createNewSubscription,
} from "../services/subscriptionsService";
import { getWeeklyClassTimes } from "../services/plansService";
import { createNewRecurringClass } from "../services/recurringClassesService";
import { logout } from "../helper/logout";

export const registerCustomer = async (req: Request, res: Response) => {
  const { name, email, password, prefecture } = req.body;

  // TODO: Validate an email and the password.
  // TODO: Hash the password.

  try {
    // Insert the customer data into the DB.
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        password,
        prefecture,
      },
    });

    // Exclude the password from the response.
    const { password: _, ...customerWithoutPassword } = customer;

    res.status(200).json({
      redirectUrl: "/login",
      message: "Customer is registered successfully",
      customer: customerWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const loginCustomer = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // TODO: Check if the password is correct or not.

    // Exclude the password from the response.
    const { password: _, ...customerWithoutPassword } = customer;

    // Set the session.
    req.session = {
      userId: customer.id,
      userType: "customer",
    };

    res.status(200).json({
      redirectUrl: `/customers/${customer.id}/classes`,
      message: "Customer logged in successfully",
      customer: customerWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const logoutCustomer = async (req: Request, res: Response) => {
  return logout(req, res, "customer");
};

export const getCustomersClasses = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    // Fetch the Customer data from the DB
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { classes: true },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Exclude the password from the response.
    const { password, ...customerWithoutPassword } = customer;

    res.json({ customer: customerWithoutPassword });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getSubscriptionsByIdController = async (
  req: Request,
  res: Response,
) => {
  const customerId = parseInt(req.params.id);

  try {
    const subscriptions = await getSubscriptionsById(customerId);

    res.json({ subscriptions });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  const customerId = parseInt(req.params.id);

  if (isNaN(customerId)) {
    return res.status(400).json({ error: "Invalid customer ID." });
  }

  try {
    const customer = await fetchCustomerById(customerId);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    res.json({ customer });
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

export const updateCustomerProfile = async (req: Request, res: Response) => {
  const customerId = parseInt(req.params.id);
  const { name, email, prefecture } = req.body;

  try {
    const customer = await updateCustomer(customerId, name, email, prefecture);

    res.status(200).json({
      message: "Customer is updated successfully",
      customer,
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

export const registerSubscriptionController = async (
  req: Request,
  res: Response,
) => {
  const customerId = parseInt(req.params.id);
  const { planId, startAt } = req.body;

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
    };
    const newSubscription = await createNewSubscription(subscriptionData);
    if (!newSubscription) {
      res.status(500).json({ error: "Failed to create subscription" });
      return;
    }
    const subscriptionId = newSubscription.id;

    // Create the same number of recurring class records as weekly class times
    for (let i = 0; i < weeklyClassTimes; i++) {
      const newRecurringClass = await createNewRecurringClass(subscriptionId);
      if (!newRecurringClass) {
        res.status(500).json({ error: "Failed to create recurring class" });
        return;
      }
    }

    res.status(200).json({ newSubscription });
  } catch (error) {
    res.status(500).json({ error });
  }
};
