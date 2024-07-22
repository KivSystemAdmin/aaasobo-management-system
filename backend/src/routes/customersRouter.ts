import express from "express";
import {
  getCustomersClasses,
  getSubscriptionsByIdController,
  loginCustomer,
  registerCustomer,
} from "../controllers/customersController";

export const customersRouter = express.Router();

// http://localhost:4000/customers

customersRouter.post("/register", registerCustomer);
customersRouter.post("/login", loginCustomer);
customersRouter.get("/:id", getCustomersClasses);
customersRouter.get("/:id/subscriptions", getSubscriptionsByIdController);
