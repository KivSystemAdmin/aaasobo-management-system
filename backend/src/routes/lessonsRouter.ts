import express from "express";
import { getAllLessonsController } from "../controllers/lessonsController";

export const lessonsRouter = express.Router();

// http://localhost:4000/lessons

lessonsRouter.get("/", getAllLessonsController);
