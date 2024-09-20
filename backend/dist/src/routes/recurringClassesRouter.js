"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.recurringClassesRouter = void 0;
const express_1 = __importDefault(require("express"));
const parseId_middleware_1 = require("../middlewares/parseId.middleware");
const recurringClassesController_1 = require("../controllers/recurringClassesController");
exports.recurringClassesRouter = express_1.default.Router();
// http://localhost:4000/recurring-classes
exports.recurringClassesRouter.get(
  "/",
  recurringClassesController_1.getRecurringClassesBySubscriptionIdController,
);
exports.recurringClassesRouter.post(
  "/",
  recurringClassesController_1.addRecurringClassController,
);
exports.recurringClassesRouter.put(
  "/:id",
  parseId_middleware_1.parseId,
  (req, res) =>
    (0, recurringClassesController_1.updateRecurringClassesController)(
      req,
      res,
    ),
);
exports.recurringClassesRouter.get(
  "/by-instructorId",
  recurringClassesController_1.getRecurringClassesByInstructorIdController,
);
