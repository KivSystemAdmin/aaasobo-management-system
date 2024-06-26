import express from "express";
import { getAllInstructors } from "../controllers/instructorsController";

export const instructorsRouter = express.Router();

// http://localhost:4000/instructors

instructorsRouter.get("/", getAllInstructors);
