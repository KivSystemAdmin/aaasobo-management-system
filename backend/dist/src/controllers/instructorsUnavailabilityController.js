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
exports.createInstructorUnavailability = exports.getInstructorUnavailabilities =
  void 0;
const instructorsUnavailabilitiesService_1 = require("../services/instructorsUnavailabilitiesService");
const getInstructorUnavailabilities = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const data = yield (0,
      instructorsUnavailabilitiesService_1.getInstructorUnavailabilities)(
        req.id,
      );
      return res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.getInstructorUnavailabilities = getInstructorUnavailabilities;
const createInstructorUnavailability = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { dateTime } = req.body;
    try {
      const instructorUnavailability = yield (0,
      instructorsUnavailabilitiesService_1.createInstructorUnavailability)(
        req.id,
        dateTime,
      );
      return res.status(200).json({ instructorUnavailability });
    } catch (error) {
      res.status(500).json({ message: `${error}` });
    }
  });
exports.createInstructorUnavailability = createInstructorUnavailability;
