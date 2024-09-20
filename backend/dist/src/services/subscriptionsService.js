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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionById =
  exports.createNewSubscription =
  exports.getSubscriptionsById =
  exports.getAllSubscriptions =
  exports.getActiveSubscription =
    void 0;
const prismaClient_1 = require("../../prisma/prismaClient");
function getActiveSubscription(customerId) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      // A subscription is active if its endAt is null.
      // Assume a customer only has one active subscription.
      const subscriptions = yield prismaClient_1.prisma.subscription.findMany({
        where: { customerId, endAt: null },
        include: { plan: true },
      });
      if (subscriptions.length > 1) {
        throw new Error("Multiple active subscriptions found.");
      }
      return subscriptions[0];
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch subscription.");
    }
  });
}
exports.getActiveSubscription = getActiveSubscription;
const getAllSubscriptions = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    // Fetch all subscriptions data from the DB
    try {
      const subscriptions = yield prismaClient_1.prisma.subscription.findMany({
        include: { plan: true, customer: { include: { children: true } } },
        orderBy: { customer: { id: "asc" } },
      });
      return subscriptions;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch subscriptions.");
    }
  });
exports.getAllSubscriptions = getAllSubscriptions;
const getSubscriptionsById = (customerId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    // Fetch subscriptions by customer id
    try {
      const subscriptions = yield prismaClient_1.prisma.subscription.findMany({
        where: { customerId },
        include: { plan: true },
      });
      return subscriptions;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch the customer's subscriptions.");
    }
  });
exports.getSubscriptionsById = getSubscriptionsById;
// Create new subscriptions
const createNewSubscription = (subscriptionData) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const newSubscription = yield prismaClient_1.prisma.subscription.create({
        data: subscriptionData,
      });
      return newSubscription;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to create new subscription.");
    }
  });
exports.createNewSubscription = createNewSubscription;
// Get subscription by subscription id
const getSubscriptionById = (subscriptionId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const subscription = yield prismaClient_1.prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true, customer: true },
      });
      return subscription;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch subscription.");
    }
  });
exports.getSubscriptionById = getSubscriptionById;
