import express from "express";
import {
  getAllInstructorsAvailabilitiesController,
  getInstructor,
  addAvailability,
  deleteAvailability,
  extendAvailability,
} from "../controllers/instructorsController";

export const instructorsRouter = express.Router();

// http://localhost:4000/instructors

instructorsRouter.get("/", getAllInstructorsAvailabilitiesController);
instructorsRouter.get("/:id", getInstructor);
instructorsRouter.post("/:id/availability", addAvailability);
instructorsRouter.delete("/:id/availability", deleteAvailability);
instructorsRouter.put("/:id/availability/extend", extendAvailability);
