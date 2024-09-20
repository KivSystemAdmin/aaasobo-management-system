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
exports.authenticateInstructorSession =
  exports.authenticateCustomerSession =
  exports.authenticateAdminSession =
  exports.requireAuthentication =
    void 0;
// Check if the user is authenticated or not.
const requireAuthentication = (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (
      ((_a = req.session) === null || _a === void 0 ? void 0 : _a.userType) !==
      "admin"
    ) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    next();
  });
exports.requireAuthentication = requireAuthentication;
// Check if the admin session is authenticated or not.
const authenticateAdminSession = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const isAuthenticated =
      ((_b = req.session) === null || _b === void 0 ? void 0 : _b.userType) ===
      "admin";
    res.status(200).json({ isAuthenticated: isAuthenticated });
  });
exports.authenticateAdminSession = authenticateAdminSession;
// Check if the customer session is authenticated or not.
const authenticateCustomerSession = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    const isAuthenticated =
      ((_c = req.session) === null || _c === void 0 ? void 0 : _c.userType) ===
        "customer" &&
      ((_d = req.session) === null || _d === void 0 ? void 0 : _d.userId) ===
        customerId;
    res.status(200).json({ isAuthenticated: isAuthenticated });
  });
exports.authenticateCustomerSession = authenticateCustomerSession;
// Check if the instructor session is authenticated or not.
const authenticateInstructorSession = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    const instructorId = parseInt(req.params.id);
    if (isNaN(instructorId)) {
      return res.status(400).json({ message: "Invalid instructor ID" });
    }
    const isAuthenticated =
      ((_e = req.session) === null || _e === void 0 ? void 0 : _e.userType) ===
        "instructor" &&
      ((_f = req.session) === null || _f === void 0 ? void 0 : _f.userId) ===
        instructorId;
    res.status(200).json({ isAuthenticated: isAuthenticated });
  });
exports.authenticateInstructorSession = authenticateInstructorSession;
