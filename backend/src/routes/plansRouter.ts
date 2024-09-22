import express from "express";
import { getAllPlansController } from "../../src/controllers/plansController";

export const plansRouter = express.Router();

// http://localhost:4000/plans

plansRouter.get("/", getAllPlansController);
