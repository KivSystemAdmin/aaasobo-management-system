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
exports.getInstructorAvailabilitiesTomorrowAndAfter =
  exports.getInstructorAvailabilitiesTodayAndAfter = void 0;
const instructorsAvailabilitiesService_1 = require("../services/instructorsAvailabilitiesService");
const getInstructorAvailabilitiesTodayAndAfter = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const today = new Date();
      const data = yield (0,
      instructorsAvailabilitiesService_1.fetchInstructorAvailabilitiesTodayAndAfter)(
        req.id,
        today,
      );
      return res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.getInstructorAvailabilitiesTodayAndAfter =
  getInstructorAvailabilitiesTodayAndAfter;
const getInstructorAvailabilitiesTomorrowAndAfter = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const data = yield (0,
      instructorsAvailabilitiesService_1.fetchInstructorAvailabilitiesTodayAndAfter)(
        req.id,
        tomorrow,
      );
      return res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.getInstructorAvailabilitiesTomorrowAndAfter =
  getInstructorAvailabilitiesTomorrowAndAfter;
