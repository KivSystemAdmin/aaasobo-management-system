import { Response } from "express";
import { RequestWithId } from "../middlewares/parseId.middleware";
import { getSubscriptionById } from "../services/subscriptionsService";

export const getSubscriptionByIdController = async (
  req: RequestWithId,
  res: Response,
) => {
  try {
    const subscription = await getSubscriptionById(req.id);

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found." });
    }

    res.json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    });
  }
};
