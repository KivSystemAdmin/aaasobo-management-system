import express from "express";
import {
  getAllInstructorsAvailabilitiesController,
  getInstructor,
  addAvailability,
  deleteAvailability,
  RecurringAvailability,
  getInstructorAvailabilities,
  getAllInstructorsController,
  getRecurringAvailabilityById,
  loginInstructorController,
} from "../controllers/instructorsController";
import { type RequestWithId, parseId } from "../middlewares/parseId.middleware";
import {
  createInstructorUnavailability,
  getInstructorUnavailabilities,
} from "../controllers/instructorsUnavailabilityController";
import { authenticateInstructorSession } from "../middlewares/auth.middleware";
import { getInstructorClasses } from "../controllers/classesController";
import {
  getInstructorAvailabilitiesTodayAndAfter,
  getInstructorAvailabilitiesTomorrowAndAfter,
} from "../controllers/instructorsAvailabilityController";

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

instructorsRouter.get("/:id/availability", parseId, (req, res) => {
  getInstructorAvailabilities(req as RequestWithId, res);
});
instructorsRouter.get("/:id/recurringAvailabilityById", parseId, (req, res) =>
  getRecurringAvailabilityById(req as RequestWithId, res),
);
instructorsRouter.get("/", getAllInstructorsController);

instructorsRouter.get("/authentication", authenticateInstructorSession);

instructorsRouter.get("/:id/classes", parseId, (req, res) => {
  getInstructorClasses(req as RequestWithId, res);
});
instructorsRouter.post("/login", loginInstructorController);

instructorsRouter.get(
  "/:id/availabilities/after-today",
  parseId,
  (req, res) => {
    getInstructorAvailabilitiesTodayAndAfter(req as RequestWithId, res);
  },
);
instructorsRouter.get(
  "/:id/availabilities/after-tomorrow",
  parseId,
  (req, res) => {
    getInstructorAvailabilitiesTomorrowAndAfter(req as RequestWithId, res);
  },
);
