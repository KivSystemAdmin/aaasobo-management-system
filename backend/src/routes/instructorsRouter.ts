import express from "express";
import {
  getAllInstructors,
  getInstructor,
  addAvailability,
  deleteAvailability,
} from "../controllers/instructorsController";

export const instructorsRouter = express.Router();

// http://localhost:4000/instructors

instructorsRouter.get("/", getAllInstructors);
instructorsRouter.get("/:id", getInstructor);
instructorsRouter.post("/:id/availability", addAvailability);
instructorsRouter.delete("/:id/availability", deleteAvailability);
