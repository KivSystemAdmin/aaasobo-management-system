import { Request, Response } from "express";
import { getAllPlans } from "../services/plansService";

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
