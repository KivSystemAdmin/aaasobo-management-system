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
exports.logout = void 0;
const logout = (req, res, userType) =>
  __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (
      !((_a = req.session) === null || _a === void 0 ? void 0 : _a.userType)
    ) {
      return res.status(200).end();
    }
    if (req.session.userType !== userType) {
      return res.status(401).json({
        message: `You are now logged in as ${req.session.userType}.`,
      });
    }
    req.session = null;
    res.status(200).end();
  });
exports.logout = logout;
