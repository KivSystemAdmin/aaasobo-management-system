import { prisma } from "../../prisma/prismaClient";

export async function getActiveSubscription(customerId: number) {
  try {
    // A subscription is active if its endAt is null.
    // Assume a customer only has one active subscription.
    const subscriptions = await prisma.subscription.findMany({
      where: { customerId, endAt: null },
      include: { plan: true },
    });
    if (subscriptions.length > 1) {
      throw new Error("Multiple active subscriptions found.");
    }
    return subscriptions[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch subscription.");
  }
}

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
      include: { plan: true },
    });

    return subscriptions;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch the customer's subscriptions.");
  }
};
