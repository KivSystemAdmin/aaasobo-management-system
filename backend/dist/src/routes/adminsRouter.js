"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminsRouter = void 0;
const express_1 = __importDefault(require("express"));
const adminsController_1 = require("../controllers/adminsController");
const auth_middleware_1 = require("../middlewares/auth.middleware");
exports.adminsRouter = express_1.default.Router();
// http://localhost:4000/admins
exports.adminsRouter.post("/login", adminsController_1.loginAdminController);
exports.adminsRouter.get("/logout", adminsController_1.logoutAdminController);
exports.adminsRouter.post(
  "/register",
  auth_middleware_1.requireAuthentication,
  adminsController_1.registerAdminController,
);
exports.adminsRouter.get(
  "/authentication",
  auth_middleware_1.authenticateAdminSession,
);
exports.adminsRouter.post(
  "/instructor-list/register",
  auth_middleware_1.requireAuthentication,
  adminsController_1.registerInstructorController,
);
exports.adminsRouter.get(
  "/instructor-list",
  adminsController_1.getAllInstructorsController,
);
exports.adminsRouter.get(
  "/customer-list",
  adminsController_1.getAllCustomersController,
);
exports.adminsRouter.get(
  "/child-list",
  adminsController_1.getAllChildrenController,
);
