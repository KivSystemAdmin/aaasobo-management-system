"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersRouter = void 0;
const express_1 = __importDefault(require("express"));
const customersController_1 = require("../controllers/customersController");
const auth_middleware_1 = require("../middlewares/auth.middleware");
exports.customersRouter = express_1.default.Router();
// http://localhost:4000/customers
exports.customersRouter.post(
  "/register",
  customersController_1.registerCustomer,
);
exports.customersRouter.post("/login", customersController_1.loginCustomer);
exports.customersRouter.post("/logout", customersController_1.logoutCustomer);
exports.customersRouter.get("/:id", customersController_1.getCustomersClasses);
exports.customersRouter.get(
  "/:id/subscriptions",
  customersController_1.getSubscriptionsByIdController,
);
exports.customersRouter.get(
  "/:id/customer",
  customersController_1.getCustomerById,
);
exports.customersRouter.patch(
  "/:id",
  customersController_1.updateCustomerProfile,
);
exports.customersRouter.post(
  "/:id/subscription",
  customersController_1.registerSubscriptionController,
);
exports.customersRouter.get(
  "/:id/authentication",
  auth_middleware_1.authenticateCustomerSession,
);
