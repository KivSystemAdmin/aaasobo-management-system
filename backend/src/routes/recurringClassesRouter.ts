import express from "express";
import { parseId, RequestWithId } from "../middlewares/parseId.middleware";
import {
  addRecurringClassController,
  getRecurringClassesBySubscriptionIdController,
  updateRecurringClassesController,
} from "../controllers/recurringClassesController";

export const recurringClassesRouter = express.Router();

// http://localhost:4000/recurring-classes

recurringClassesRouter.get("/", getRecurringClassesBySubscriptionIdController);
recurringClassesRouter.post("/", addRecurringClassController);
recurringClassesRouter.put("/:id", parseId, (req, res) =>
  updateRecurringClassesController(req as RequestWithId, res),
);
