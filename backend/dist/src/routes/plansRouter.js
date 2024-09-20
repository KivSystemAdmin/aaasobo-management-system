"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.plansRouter = void 0;
const express_1 = __importDefault(require("express"));
const plansController_1 = require("../controllers/plansController");
exports.plansRouter = express_1.default.Router();
// http://localhost:4000/plans
exports.plansRouter.get("/", plansController_1.getAllPlansController);
