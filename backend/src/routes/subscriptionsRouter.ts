import express from "express";
import {
  parseId,
  RequestWithId,
} from "../../src/middlewares/parseId.middleware";
import { getSubscriptionByIdController } from "../../src/controllers/subscriptionsController";

export const subscriptionsRouter = express.Router();

// http://localhost:4000/subscriptions

subscriptionsRouter.get("/:id", parseId, (req, res) =>
  getSubscriptionByIdController(req as RequestWithId, res),
);
