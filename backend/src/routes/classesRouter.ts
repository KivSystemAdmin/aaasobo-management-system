import express from "express";
import {
  cancelClassController,
  createClassController,
  createClassesForMonthController,
  deleteClassController,
  getAllClassesController,
  getClassByIdController,
  getClassesByCustomerIdController,
  getClassesForCustomerCalendar,
  getClassesForInstructorCalendar,
  nonRebookableCancelController,
  updateClassController,
} from "../controllers/classesController";

export const classesRouter = express.Router();

// http://localhost:4000/classes

classesRouter.get("/", getAllClassesController);
classesRouter.get("/:id", getClassesByCustomerIdController);
classesRouter.get("/class/:id", getClassByIdController);
classesRouter.get(
  "/calendar/instructor/:instructorId",
  getClassesForInstructorCalendar,
);
classesRouter.get(
  "/calendar/customer/:customerId",
  getClassesForCustomerCalendar,
);
classesRouter.post("/create-classes", createClassesForMonthController);
classesRouter.post("/", createClassController);

classesRouter.delete("/:id", deleteClassController);

classesRouter.patch("/:id", updateClassController);
classesRouter.patch("/:id/cancel", cancelClassController);
classesRouter.patch(
  "/:id/non-rebookable-cancel",
  nonRebookableCancelController,
);
