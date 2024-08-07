import express from "express";
import {
  getCustomerById,
  getCustomersClasses,
  getSubscriptionsByIdController,
  loginCustomer,
  registerCustomer,
  updateCustomerProfile,
  registerSubscriptionController,
} from "../controllers/customersController";
import { authenticateCustomerSession } from "../middlewares/auth.middleware";

export const customersRouter = express.Router();

// http://localhost:4000/customers

customersRouter.post("/register", registerCustomer);
customersRouter.post("/login", loginCustomer);

customersRouter.get("/:id", getCustomersClasses);
customersRouter.get("/:id/subscriptions", getSubscriptionsByIdController);
customersRouter.get("/:id/customer", getCustomerById);

customersRouter.patch("/:id", updateCustomerProfile);
customersRouter.post("/:id/subscription", registerSubscriptionController);
customersRouter.get("/authentication", authenticateCustomerSession);
