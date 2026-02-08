import { Response } from "express";
import { RequestWithParams } from "../middlewares/validationMiddleware";
import type { SubscriptionIdParams } from "../../../shared/schemas/subscriptions";
import {
  getSubscriptionById,
  terminateSubscription,
  updatePlanIdOfSubscription,
  updateSelectTypeUrl,
} from "../services/subscriptionsService";
import { prisma } from "../../prisma/prismaClient";
import {
  createNewRecurringClass,
  getRegularClassById,
  getRegularClassesBySubscriptionId,
  terminateRecurringClass,
} from "../services/recurringClassesService";
import { getPlanById } from "../services/plansService";

export const getSubscriptionByIdController = async (
  req: RequestWithParams<SubscriptionIdParams>,
  res: Response,
) => {
  try {
    const subscription = await getSubscriptionById(req.params.id);

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

export const deleteSubscriptionController = async (
  req: RequestWithParams<SubscriptionIdParams>,
  res: Response,
) => {
  try {
    const recurringClasses = await getRegularClassesBySubscriptionId(
      req.params.id,
    );
    if (!recurringClasses) {
      return res.status(404).json({ error: "Recurring Class not found." });
    }

    const date = new Date();

    await prisma.$transaction(async (tx) => {
      for (const recurringClass of recurringClasses) {
        await terminateRecurringClass(tx, recurringClass.id, date);
      }

      const terminatedSubscription = await terminateSubscription(
        tx,
        req.params.id,
        date,
      );

      res.status(200).json({
        message: "Subscription deleted successfully",
        id: terminatedSubscription.id,
      });
    });
  } catch (error) {
    console.error("Error deleting recurring class:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    });
  }
};

export const updateSubscriptionToAddClassController = async (
  req: RequestWithParams<SubscriptionIdParams>,
  res: Response,
) => {
  try {
    const subscription = await getSubscriptionById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found." });
    }
    const { updateSubscriptionData } = req.body;

    const planId = updateSubscriptionData.planId;
    const times = updateSubscriptionData.times;
    const selectType = updateSubscriptionData.selectType;

    // validate
    const plan = await getPlanById(planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found." });
    }

    if (!selectType) {
      return res.status(404).json({ error: "Select type URL not found." });
    }

    if (times !== plan.weeklyClassTimes - subscription.plan.weeklyClassTimes) {
      return res
        .status(400)
        .json({ error: "Number of weekly classes is invalid." });
    }

    await prisma.$transaction(async (tx) => {
      // Updata the plan id of the subscription.
      await updatePlanIdOfSubscription(tx, subscription.id, planId, selectType);

      // Add new recurring classes
      for (let i = 0; i < times; i++) {
        await createNewRecurringClass(tx, subscription.id);
      }

      res.status(200).json({
        message: "Subscription updated successfully",
        id: subscription.id,
      });
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    });
  }
};

export const updateSubscriptionToTerminateClassController = async (
  req: RequestWithParams<SubscriptionIdParams>,
  res: Response,
) => {
  try {
    const { updateSubscriptionData } = req.body;

    const planId = updateSubscriptionData.planId;
    const recurringClassIds = updateSubscriptionData.recurringClassIds;
    const selectType = updateSubscriptionData.selectType;

    // validate
    if (!Array.isArray(recurringClassIds)) {
      return res.status(400).json({ error: "Recurring Ids must be an array." });
    }

    const subscription = await getSubscriptionById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found." });
    }

    const plan = await getPlanById(planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found." });
    }

    if (!selectType) {
      return res.status(404).json({ error: "Select type URL not found." });
    }

    if (
      recurringClassIds.length !==
      subscription.plan.weeklyClassTimes - plan.weeklyClassTimes
    ) {
      return res
        .status(400)
        .json({ error: "Invalid number of recurring classes." });
    }

    for (const recurringClassId of recurringClassIds) {
      const recurringClass = await getRegularClassById(recurringClassId);
      if (!recurringClass) {
        return res.status(404).json({ error: "Recurring class not found." });
      }
    }
    const today = new Date();

    await prisma.$transaction(async (tx) => {
      // Updata the plan id of the subscription.
      await updatePlanIdOfSubscription(tx, subscription.id, planId, selectType);

      // Terminate recurring classes
      for (const recurringClassId of recurringClassIds) {
        await terminateRecurringClass(tx, recurringClassId, today);
      }
    });

    res.status(200).json({
      message: "Subscription updated successfully",
      id: subscription.id,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    });
  }
};

export const updateSelectTypeUrlController = async (
  req: RequestWithParams<SubscriptionIdParams>,
  res: Response,
) => {
  try {
    const { updateSubscriptionData } = req.body;
    const selectType = updateSubscriptionData.selectType;

    // validate
    const subscription = await getSubscriptionById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found." });
    }

    if (!selectType) {
      return res.status(404).json({ error: "Select type URL not found." });
    }

    await prisma.$transaction(async (tx) => {
      // Updata the plan id of the subscription.
      await updateSelectTypeUrl(tx, subscription.id, selectType);
    });

    res.status(200).json({
      message: "Subscription updated successfully",
      id: subscription.id,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    });
  }
};
