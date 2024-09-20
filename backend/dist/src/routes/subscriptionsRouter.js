"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionsRouter = void 0;
const express_1 = __importDefault(require("express"));
const parseId_middleware_1 = require("../middlewares/parseId.middleware");
const subscriptionsController_1 = require("../controllers/subscriptionsController");
exports.subscriptionsRouter = express_1.default.Router();
// http://localhost:4000/subscriptions
exports.subscriptionsRouter.get(
  "/:id",
  parseId_middleware_1.parseId,
  (req, res) =>
    (0, subscriptionsController_1.getSubscriptionByIdController)(req, res),
);
