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
exports.getAllPlansController = void 0;
const plansService_1 = require("../services/plansService");
// Get all plans' information
const getAllPlansController = (_, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Fetch all plan data.
      const data = yield (0, plansService_1.getAllPlans)();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.getAllPlansController = getAllPlansController;
