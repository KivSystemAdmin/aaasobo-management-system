import express from "express";
import {
  getAllInstructorsAvailabilitiesController,
  getInstructor,
  addAvailability,
  deleteAvailability,
  RecurringAvailability,
} from "../controllers/instructorsController";
import { type RequestWithId, parseId } from "../middlewares/parseId.middleware";
import {
  createInstructorUnavailability,
  getInstructorUnavailabilities,
} from "../controllers/instructorsUnavailabilityController";

export const instructorsRouter = express.Router();

// http://localhost:4000/instructors

instructorsRouter.get("/", getAllInstructorsAvailabilitiesController);
instructorsRouter.get("/:id", getInstructor);
instructorsRouter.get("/:id/recurringAvailability", parseId, (req, res) =>
  RecurringAvailability.get(req as RequestWithId, res),
);
instructorsRouter.put("/:id/recurringAvailability", parseId, (req, res) =>
  RecurringAvailability.put(req as RequestWithId, res),
);
instructorsRouter.put("/:id/availability", parseId, (req, res) =>
  addAvailability(req as RequestWithId, res),
);
instructorsRouter.delete("/:id/availability", parseId, (req, res) =>
  deleteAvailability(req as RequestWithId, res),
);

instructorsRouter.get("/:id/unavailability", parseId, (req, res) => {
  getInstructorUnavailabilities(req as RequestWithId, res);
});
instructorsRouter.put("/:id/unavailability", parseId, (req, res) => {
  createInstructorUnavailability(req as RequestWithId, res);
});
