import { Prisma } from "../../generated/prisma";
import { prisma } from "../../prisma/prismaClient";

export const getAllSubscriptions = async () => {
  // Fetch all subscriptions data from the DB
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: { plan: true, customer: { include: { children: true } } },
      orderBy: { customer: { id: "asc" } },
    });

    return subscriptions;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch subscriptions.");
  }
};

export const getSubscriptionsById = async (customerId: number) => {
  // Fetch subscriptions by customer id
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { customerId },
      include: { plan: true, customer: { select: { terminationAt: true } } },
    });

    const formattedSubscriptions = subscriptions.map((subscription) => ({
      ...subscription,
      customerTerminationAt: subscription.customer.terminationAt,
    }));

    return formattedSubscriptions;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch the customer's subscriptions.");
  }
};

// Create new subscriptions
export const createNewSubscription = async (subscriptionData: {
  planId: number;
  customerId: number;
  startAt: Date;
  selectType: string;
}) => {
  try {
    const newSubscription = await prisma.subscription.create({
      data: subscriptionData,
    });
    return newSubscription;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create new subscription.");
  }
};

// Get subscription by subscription id
export const getSubscriptionById = async (subscriptionId: number) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, customer: true },
    });

    return subscription;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch subscription.");
  }
};

// Terminate the subscription
export const terminateSubscription = async (
  tx: Prisma.TransactionClient,
  subscriptionId: number,
  endDate: Date,
) => {
  try {
    // Set endAt to indicate termination
    const subscription = await tx.subscription.update({
      where: { id: subscriptionId },
      data: { endAt: endDate },
    });

    return subscription;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to terminate the subscription.");
  }
};

// Update the plan id of the subscription
export const updatePlanIdOfSubscription = async (
  tx: Prisma.TransactionClient,
  subscriptionId: number,
  planId: number,
  selectType: string,
) => {
  try {
    const subscription = await tx.subscription.update({
      where: { id: subscriptionId },
      data: { planId: planId, selectType: selectType },
    });

    return subscription;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the subscription.");
  }
};

// Update the
export const updateSelectTypeUrl = async (
  tx: Prisma.TransactionClient,
  subscriptionId: number,
  selectType: string,
) => {
  try {
    const subscription = await tx.subscription.update({
      where: { id: subscriptionId },
      data: { selectType: selectType },
    });

    return subscription;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the subscription.");
  }
};
