import express from "express";
import {
  loginAdmin,
  logoutAdmin,
  registerAdmin,
} from "../controllers/adminsController";
import {
  requireAuthentication,
  authenticateAdminSession,
} from "../middlewares/auth.middleware";

export const adminsRouter = express.Router();

// http://localhost:4000/admins

adminsRouter.post("/login", loginAdmin);
adminsRouter.post("/register", requireAuthentication, registerAdmin);
adminsRouter.get("/authentication", authenticateAdminSession);
adminsRouter.get("/logout", logoutAdmin);
