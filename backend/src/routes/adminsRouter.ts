import express from "express";
import {
  loginAdmin,
  logoutAdmin,
  registerAdmin,
} from "../controllers/adminsController";
import { authenticateSession } from "../middlewares/auth.middleware";

export const adminsRouter = express.Router();

// http://localhost:4000/admins

adminsRouter.post("/login", loginAdmin);
adminsRouter.post("/register", registerAdmin);
adminsRouter.get("/logout", logoutAdmin);

adminsRouter.use((req, res) => {
  const excludePaths = ["/login", "/logout"];
  if (req.method === "GET" && !excludePaths.includes(req.path)) {
    return authenticateSession(req, res);
  }
});
