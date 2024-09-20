"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.childrenRouter = void 0;
const express_1 = __importDefault(require("express"));
const childrenController_1 = require("../controllers/childrenController");
exports.childrenRouter = express_1.default.Router();
// http://localhost:4000/children
exports.childrenRouter.get("/", childrenController_1.getChildrenController);
exports.childrenRouter.get("/:id", childrenController_1.getChildByIdController);
exports.childrenRouter.post("/", childrenController_1.registerChildController);
exports.childrenRouter.patch(
  "/:id",
  childrenController_1.updateChildController,
);
exports.childrenRouter.delete(
  "/:id",
  childrenController_1.deleteChildController,
);
