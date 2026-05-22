import { Request, Response } from "express";
import { RequestWithParams } from "../middlewares/validationMiddleware";
import {
  getAllPlans,
  getPlanById,
  deleteUnnecessaryPlans,
} from "../services/plansService";
import type { PlanIdParams } from "../../../shared/schemas/plans";

// Get all plans' information
export const getAllPlansController = async (_: Request, res: Response) => {
  try {
    // Fetch all plan data.
    const data = await getAllPlans();
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

function setErrorResponse(res: Response, error: unknown) {
  return res
    .status(500)
    .json({ message: error instanceof Error ? error.message : `${error}` });
}

// Get plan by ID
export const getPlanController = async (
  req: RequestWithParams<PlanIdParams>,
  res: Response,
) => {
  const { id } = req.params;
  try {
    const plan = await getPlanById(id);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found." });
    }
    return res.status(200).json({
      plan: {
        id: plan.id,
        name: plan.name,
        weeklyClassTimes: plan.weeklyClassTimes,
        description: plan.description,
        englishBackground: plan.englishBackground,
      },
    });
  } catch (error) {
    return setErrorResponse(res, error);
  }
};

// Delete unnecessary plans
export const deleteUnnecessaryPlansController = async (
  _: Request,
  res: Response,
) => {
  try {
    const deletedPlans = await deleteUnnecessaryPlans();
    res.status(200).json({ deletedPlans });
  } catch (error) {
    console.error("Error deleting unnecessary plans", {
      error,
      context: {
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};
