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
exports.getWeeklyClassTimes = exports.getAllPlans = void 0;
const prismaClient_1 = require("../../prisma/prismaClient");
// Fetch all plan data.
const getAllPlans = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      return yield prismaClient_1.prisma.plan.findMany();
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch plans.");
    }
  });
exports.getAllPlans = getAllPlans;
// Fetch the number of weekly class times by ID.
const getWeeklyClassTimes = (id) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      return yield prismaClient_1.prisma.plan.findUnique({
        where: { id },
        select: { weeklyClassTimes: true },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch weekly class times.");
    }
  });
exports.getWeeklyClassTimes = getWeeklyClassTimes;
