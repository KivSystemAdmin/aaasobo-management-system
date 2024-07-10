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
