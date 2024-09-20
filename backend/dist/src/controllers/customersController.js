"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]];
      }
    return t;
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSubscriptionController =
  exports.updateCustomerProfile =
  exports.getCustomerById =
  exports.getSubscriptionsByIdController =
  exports.getCustomersClasses =
  exports.logoutCustomer =
  exports.loginCustomer =
  exports.registerCustomer =
    void 0;
const prismaClient_1 = require("../../prisma/prismaClient");
const customersService_1 = require("../services/customersService");
const subscriptionsService_1 = require("../services/subscriptionsService");
const plansService_1 = require("../services/plansService");
const recurringClassesService_1 = require("../services/recurringClassesService");
const logout_1 = require("../helper/logout");
const registerCustomer = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, prefecture } = req.body;
    // TODO: Validate an email and the password.
    // TODO: Hash the password.
    try {
      // Insert the customer data into the DB.
      const customer = yield prismaClient_1.prisma.customer.create({
        data: {
          name,
          email,
          password,
          prefecture,
        },
      });
      // Exclude the password from the response.
      const { password: _ } = customer,
        customerWithoutPassword = __rest(customer, ["password"]);
      res.status(200).json({
        redirectUrl: "/login",
        message: "Customer is registered successfully",
        customer: customerWithoutPassword,
      });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.registerCustomer = registerCustomer;
const loginCustomer = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
      const customer = yield prismaClient_1.prisma.customer.findUnique({
        where: { email },
      });
      if (!customer) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }
      // TODO: Check if the password is correct or not.
      // Exclude the password from the response.
      const { password: _ } = customer,
        customerWithoutPassword = __rest(customer, ["password"]);
      // Set the session.
      req.session = {
        userId: customer.id,
        userType: "customer",
      };
      res.status(200).json({
        redirectUrl: `/customers/${customer.id}/classes`,
        message: "Customer logged in successfully",
        customer: customerWithoutPassword,
      });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.loginCustomer = loginCustomer;
const logoutCustomer = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    return (0, logout_1.logout)(req, res, "customer");
  });
exports.logoutCustomer = logoutCustomer;
const getCustomersClasses = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    try {
      // Fetch the Customer data from the DB
      const customer = yield prismaClient_1.prisma.customer.findUnique({
        where: { id },
        include: { classes: true },
      });
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      // Exclude the password from the response.
      const { password } = customer,
        customerWithoutPassword = __rest(customer, ["password"]);
      res.json({ customer: customerWithoutPassword });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.getCustomersClasses = getCustomersClasses;
const getSubscriptionsByIdController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const customerId = parseInt(req.params.id);
    try {
      const subscriptions = yield (0,
      subscriptionsService_1.getSubscriptionsById)(customerId);
      res.json({ subscriptions });
    } catch (error) {
      res.status(500).json({ error: `${error}` });
    }
  });
exports.getSubscriptionsByIdController = getSubscriptionsByIdController;
const getCustomerById = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ error: "Invalid customer ID." });
    }
    try {
      const customer = yield (0, customersService_1.fetchCustomerById)(
        customerId,
      );
      if (!customer) {
        return res.status(404).json({ error: "Customer not found." });
      }
      res.json({ customer });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    }
  });
exports.getCustomerById = getCustomerById;
const updateCustomerProfile = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const customerId = parseInt(req.params.id);
    const { name, email, prefecture } = req.body;
    try {
      const customer = yield (0, customersService_1.updateCustomer)(
        customerId,
        name,
        email,
        prefecture,
      );
      res.status(200).json({
        message: "Customer is updated successfully",
        customer,
      });
    } catch (error) {
      res.status(500).json({ error: `${error}` });
    }
  });
exports.updateCustomerProfile = updateCustomerProfile;
const registerSubscriptionController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const customerId = parseInt(req.params.id);
    const { planId, startAt } = req.body;
    try {
      // Get weekly class times based on plan id.
      const data = yield (0, plansService_1.getWeeklyClassTimes)(planId);
      if (!data) {
        res.status(404).json({ error: "Weekly class times not found" });
        return;
      }
      const { weeklyClassTimes } = data;
      // Create new subscription record.
      const subscriptionData = {
        planId,
        customerId,
        startAt: new Date(startAt),
      };
      const newSubscription = yield (0,
      subscriptionsService_1.createNewSubscription)(subscriptionData);
      if (!newSubscription) {
        res.status(500).json({ error: "Failed to create subscription" });
        return;
      }
      const subscriptionId = newSubscription.id;
      // Create the same number of recurring class records as weekly class times
      for (let i = 0; i < weeklyClassTimes; i++) {
        const newRecurringClass = yield (0,
        recurringClassesService_1.createNewRecurringClass)(subscriptionId);
        if (!newRecurringClass) {
          res.status(500).json({ error: "Failed to create recurring class" });
          return;
        }
      }
      res.status(200).json({ newSubscription });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.registerSubscriptionController = registerSubscriptionController;
