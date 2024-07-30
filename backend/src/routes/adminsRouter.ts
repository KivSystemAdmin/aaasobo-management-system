import express from "express";
import {
  loginAdminController,
  logoutAdminController,
  registerAdminController,
  registerInstructorController,
  getAllInstructorsController,
  getAllCustomersController,
} from "../controllers/adminsController";
import {
  requireAuthentication,
  authenticateAdminSession,
} from "../middlewares/auth.middleware";

export const adminsRouter = express.Router();

// http://localhost:4000/admins

adminsRouter.post("/login", loginAdminController);
adminsRouter.get("/logout", logoutAdminController);
adminsRouter.post("/register", requireAuthentication, registerAdminController);
adminsRouter.get("/authentication", authenticateAdminSession);
adminsRouter.post(
  "/instructor-list/register",
  requireAuthentication,
  registerInstructorController,
);
adminsRouter.get("/instructor-list", getAllInstructorsController);
adminsRouter.get("/customer-list", getAllCustomersController);
