import express from "express";
import {
  getAllLessonsController,
  createLessonController,
  deleteLessonController,
  getLessonsByCustomerIdController,
} from "../controllers/lessonsController";

export const lessonsRouter = express.Router();

// http://localhost:4000/lessons

lessonsRouter.get("/", getAllLessonsController);
lessonsRouter.get("/:id", getLessonsByCustomerIdController);

lessonsRouter.post("/", createLessonController);

lessonsRouter.delete("/:id", deleteLessonController);
