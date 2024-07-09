import express from "express";
import {
  createClassController,
  deleteClassController,
  getAllClassesController,
  getClassesByCustomerIdController,
} from "../controllers/classesController";

export const classesRouter = express.Router();

// http://localhost:4000/classes

classesRouter.get("/", getAllClassesController);
classesRouter.get("/:id", getClassesByCustomerIdController);

classesRouter.post("/", createClassController);

classesRouter.delete("/:id", deleteClassController);
