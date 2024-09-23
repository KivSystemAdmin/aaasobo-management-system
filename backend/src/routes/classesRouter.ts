import express from "express";
import {
  createClassController,
  deleteClassController,
  getAllClassesController,
  getClassByIdController,
  getClassesByCustomerIdController,
  updateClassController,
} from "../controllers/classesController";

export const classesRouter = express.Router();

// http://localhost:4000/classes

classesRouter.get("/", getAllClassesController);
classesRouter.get("/:id", getClassesByCustomerIdController);
classesRouter.get("/class/:id", getClassByIdController);

classesRouter.post("/", createClassController);

classesRouter.delete("/:id", deleteClassController);

classesRouter.patch("/:id", updateClassController);
