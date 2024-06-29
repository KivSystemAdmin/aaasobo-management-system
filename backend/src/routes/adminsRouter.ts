import express from "express";
import { registerAdmin, loginAdmin } from "../controllers/adminsController";

export const adminsRouter = express.Router();

// http://localhost:4000/admins

adminsRouter.post("/register", registerAdmin);
adminsRouter.post("/login", loginAdmin);
