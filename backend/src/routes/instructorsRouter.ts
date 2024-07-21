import express from "express";
import {
  getAllInstructorsAvailabilitiesController,
  getInstructor,
  addAvailability,
  addRecurringAvailability,
  deleteAvailability,
} from "../controllers/instructorsController";
import { type RequestWithId, parseId } from "../middlewares/parseId.middleware";

export const instructorsRouter = express.Router();

// http://localhost:4000/instructors

instructorsRouter.get("/", getAllInstructorsAvailabilitiesController);
instructorsRouter.get("/:id", getInstructor);
instructorsRouter.put("/:id/recurringAvailability", parseId, (req, res) =>
  addRecurringAvailability(req as RequestWithId, res),
);
instructorsRouter.put("/:id/availability", parseId, (req, res) =>
  addAvailability(req as RequestWithId, res),
);
instructorsRouter.delete("/:id/availability", parseId, (req, res) =>
  deleteAvailability(req as RequestWithId, res),
);
