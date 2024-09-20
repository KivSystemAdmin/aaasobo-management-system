"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.classesRouter = void 0;
const express_1 = __importDefault(require("express"));
const classesController_1 = require("../controllers/classesController");
exports.classesRouter = express_1.default.Router();
// http://localhost:4000/classes
exports.classesRouter.get("/", classesController_1.getAllClassesController);
exports.classesRouter.get(
  "/:id",
  classesController_1.getClassesByCustomerIdController,
);
exports.classesRouter.get(
  "/class/:id",
  classesController_1.getClassByIdController,
);
exports.classesRouter.get(
  "/calendar/instructor/:instructorId",
  classesController_1.getClassesForInstructorCalendar,
);
exports.classesRouter.get(
  "/calendar/customer/:customerId",
  classesController_1.getClassesForCustomerCalendar,
);
exports.classesRouter.post(
  "/create-classes",
  classesController_1.createClassesForMonthController,
);
exports.classesRouter.post("/", classesController_1.createClassController);
exports.classesRouter.post(
  "/check-double-booking",
  classesController_1.checkDoubleBookingController,
);
exports.classesRouter.post(
  "/check-children-availability",
  classesController_1.checkChildrenAvailabilityController,
);
exports.classesRouter.delete("/:id", classesController_1.deleteClassController);
exports.classesRouter.patch("/:id", classesController_1.updateClassController);
exports.classesRouter.patch(
  "/:id/cancel",
  classesController_1.cancelClassController,
);
exports.classesRouter.patch(
  "/:id/non-rebookable-cancel",
  classesController_1.nonRebookableCancelController,
);
