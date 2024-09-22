import express from "express";
import {
  parseId,
  RequestWithId,
} from "../../src/middlewares/parseId.middleware";
import {
  addRecurringClassController,
  getRecurringClassesByInstructorIdController,
  getRecurringClassesBySubscriptionIdController,
  updateRecurringClassesController,
} from "../../src/controllers/recurringClassesController";

export const recurringClassesRouter = express.Router();

// http://localhost:4000/recurring-classes

recurringClassesRouter.get("/", getRecurringClassesBySubscriptionIdController);
recurringClassesRouter.post("/", addRecurringClassController);
recurringClassesRouter.put("/:id", parseId, (req, res) =>
  updateRecurringClassesController(req as RequestWithId, res),
);
recurringClassesRouter.get(
  "/by-instructorId",
  getRecurringClassesByInstructorIdController,
);
