"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.instructorsRouter = void 0;
const express_1 = __importDefault(require("express"));
const instructorsController_1 = require("../controllers/instructorsController");
const parseId_middleware_1 = require("../middlewares/parseId.middleware");
const instructorsUnavailabilityController_1 = require("../controllers/instructorsUnavailabilityController");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const classesController_1 = require("../controllers/classesController");
const instructorsAvailabilityController_1 = require("../controllers/instructorsAvailabilityController");
exports.instructorsRouter = express_1.default.Router();
// http://localhost:4000/instructors
exports.instructorsRouter.get(
  "/",
  instructorsController_1.getAllInstructorsAvailabilitiesController,
);
exports.instructorsRouter.get("/:id", instructorsController_1.getInstructor);
exports.instructorsRouter.get(
  "/:id/recurringAvailability",
  parseId_middleware_1.parseId,
  (req, res) => instructorsController_1.RecurringAvailability.get(req, res),
);
exports.instructorsRouter.put(
  "/:id/recurringAvailability",
  parseId_middleware_1.parseId,
  (req, res) => instructorsController_1.RecurringAvailability.put(req, res),
);
exports.instructorsRouter.put(
  "/:id/availability",
  parseId_middleware_1.parseId,
  (req, res) => (0, instructorsController_1.addAvailability)(req, res),
);
exports.instructorsRouter.delete(
  "/:id/availability",
  parseId_middleware_1.parseId,
  (req, res) => (0, instructorsController_1.deleteAvailability)(req, res),
);
exports.instructorsRouter.get(
  "/:id/unavailability",
  parseId_middleware_1.parseId,
  (req, res) => {
    (0, instructorsUnavailabilityController_1.getInstructorUnavailabilities)(
      req,
      res,
    );
  },
);
exports.instructorsRouter.put(
  "/:id/unavailability",
  parseId_middleware_1.parseId,
  (req, res) => {
    (0, instructorsUnavailabilityController_1.createInstructorUnavailability)(
      req,
      res,
    );
  },
);
exports.instructorsRouter.get(
  "/:id/availability",
  parseId_middleware_1.parseId,
  (req, res) => {
    (0, instructorsController_1.getInstructorAvailabilities)(req, res);
  },
);
exports.instructorsRouter.get(
  "/:id/recurringAvailabilityById",
  parseId_middleware_1.parseId,
  (req, res) =>
    (0, instructorsController_1.getRecurringAvailabilityById)(req, res),
);
exports.instructorsRouter.get(
  "/",
  instructorsController_1.getAllInstructorsController,
);
exports.instructorsRouter.get(
  "/:id/authentication",
  auth_middleware_1.authenticateInstructorSession,
);
exports.instructorsRouter.get(
  "/:id/classes",
  parseId_middleware_1.parseId,
  (req, res) => {
    (0, classesController_1.getInstructorClasses)(req, res);
  },
);
exports.instructorsRouter.post(
  "/login",
  instructorsController_1.loginInstructorController,
);
exports.instructorsRouter.post(
  "/logout",
  instructorsController_1.logoutInstructorController,
);
exports.instructorsRouter.get(
  "/:id/availabilities/after-today",
  parseId_middleware_1.parseId,
  (req, res) => {
    (0,
    instructorsAvailabilityController_1.getInstructorAvailabilitiesTodayAndAfter)(
      req,
      res,
    );
  },
);
exports.instructorsRouter.get(
  "/:id/availabilities/after-tomorrow",
  parseId_middleware_1.parseId,
  (req, res) => {
    (0,
    instructorsAvailabilityController_1.getInstructorAvailabilitiesTomorrowAndAfter)(
      req,
      res,
    );
  },
);
