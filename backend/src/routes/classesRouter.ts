import express from "express";
import {
  addRecurringClassController,
  createClassController,
  deleteClassController,
  getAllClassesController,
  getClassByIdController,
  getClassesByCustomerIdController,
  getRecurringClassesBySubscriptionIdController,
  updateClassController,
} from "../controllers/classesController";

export const classesRouter = express.Router();

// http://localhost:4000/classes

classesRouter.get(
  "/recurring-classes",
  getRecurringClassesBySubscriptionIdController,
);
classesRouter.get("/", getAllClassesController);
classesRouter.get("/:id", getClassesByCustomerIdController);
classesRouter.get("/class/:id", getClassByIdController);

classesRouter.post("/", createClassController);

classesRouter.delete("/:id", deleteClassController);

classesRouter.patch("/:id", updateClassController);
classesRouter.post("/recurring-class", addRecurringClassController);
