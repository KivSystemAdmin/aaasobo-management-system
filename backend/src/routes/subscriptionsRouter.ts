import express from "express";
import { parseId, RequestWithId } from "../middlewares/parseId.middleware";
import { getSubscriptionByIdController } from "../controllers/subscriptionsController";

export const subscriptionsRouter = express.Router();

// http://localhost:4000/subscriptions

subscriptionsRouter.get("/:id", parseId, (req, res) =>
  getSubscriptionByIdController(req as RequestWithId, res),
);
