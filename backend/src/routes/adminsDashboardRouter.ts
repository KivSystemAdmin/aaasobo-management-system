import express from "express";
import {
  registerInstructorController,
  getAllInstructorsController,
} from "../controllers/adminsDashboardController";
import { requireAuthentication } from "../middlewares/auth.middleware";

export const adminsDashboardRouter = express.Router();

// http://localhost:4000/admins/dashboard

adminsDashboardRouter.post(
  "/instructors/register",
  requireAuthentication,
  registerInstructorController
);
adminsDashboardRouter.get("/instructors", getAllInstructorsController);
