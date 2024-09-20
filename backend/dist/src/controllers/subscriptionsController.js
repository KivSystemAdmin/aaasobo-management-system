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
exports.getSubscriptionByIdController = void 0;
const subscriptionsService_1 = require("../services/subscriptionsService");
const getSubscriptionByIdController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const subscription = yield (0,
      subscriptionsService_1.getSubscriptionById)(req.id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found." });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    }
  });
exports.getSubscriptionByIdController = getSubscriptionByIdController;
