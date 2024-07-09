import express from "express";
import {
  getCustomersClasses,
  loginCustomer,
  registerCustomer,
} from "../controllers/customersController";

export const customersRouter = express.Router();

// http://localhost:4000/customers

customersRouter.post("/register", registerCustomer);
customersRouter.post("/login", loginCustomer);
customersRouter.get("/:id", getCustomersClasses);
