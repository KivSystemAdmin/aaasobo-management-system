import express from "express";
import {
  getCustomerById,
  getCustomersClasses,
  getSubscriptionsByIdController,
  loginCustomer,
  registerCustomer,
  updateCustomerProfile,
  registerSubscriptionController,
  logoutCustomer,
} from "../../src/controllers/customersController";
import { authenticateCustomerSession } from "../../src/middlewares/auth.middleware";

export const customersRouter = express.Router();

// http://localhost:4000/customers

customersRouter.post("/register", registerCustomer);
customersRouter.post("/login", loginCustomer);
customersRouter.post("/logout", logoutCustomer);

customersRouter.get("/:id", getCustomersClasses);
customersRouter.get("/:id/subscriptions", getSubscriptionsByIdController);
customersRouter.get("/:id/customer", getCustomerById);

customersRouter.patch("/:id", updateCustomerProfile);
customersRouter.post("/:id/subscription", registerSubscriptionController);
customersRouter.get("/:id/authentication", authenticateCustomerSession);
