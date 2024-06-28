import express from "express";
import {
  getAllLessonsController,
  createLessonController,
  deleteLessonController,
} from "../controllers/lessonsController";

export const lessonsRouter = express.Router();

// http://localhost:4000/lessons

lessonsRouter.get("/", getAllLessonsController);

lessonsRouter.post("/", createLessonController);

lessonsRouter.delete("/:id", deleteLessonController);
