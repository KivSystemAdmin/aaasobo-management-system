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
var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]];
      }
    return t;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllChildrenController =
  exports.registerInstructorController =
  exports.getAllInstructorsController =
  exports.getAllCustomersController =
  exports.registerAdminController =
  exports.logoutAdminController =
  exports.loginAdminController =
    void 0;
const adminsService_1 = require("../services/adminsService");
const instructorsService_1 = require("../services/instructorsService");
const customersService_1 = require("../services/customersService");
const childrenService_1 = require("../services/childrenService");
const bcrypt_1 = __importDefault(require("bcrypt"));
const logout_1 = require("../helper/logout");
const saltRounds = 12;
// Login Admin
const loginAdminController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
      // Fetch the admin data using the email.
      const admin = yield (0, adminsService_1.getAdmin)(email);
      if (!admin) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }
      // Check if the password is correct or not.
      const result = yield bcrypt_1.default.compare(password, admin.password);
      if (!result) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }
      // Set the session.
      req.session = {
        userId: admin.id,
        userType: "admin",
      };
      res.status(200).json({
        message: "Admin logged in successfully",
      });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.loginAdminController = loginAdminController;
// Logout Admin
const logoutAdminController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    return (0, logout_1.logout)(req, res, "admin");
  });
exports.logoutAdminController = logoutAdminController;
// Register Admin
const registerAdminController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    try {
      // Hash the password.
      const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
      // Insert the admin data into the DB.
      const admin = yield (0, adminsService_1.createAdmin)({
        name,
        email,
        password: hashedPassword,
      });
      // Exclude the password from the response.
      if (admin) {
        const { password: _ } = admin,
          adminWithoutPassword = __rest(admin, ["password"]);
        res.status(200).json({
          message: "Admin is registered successfully",
          admin: adminWithoutPassword,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: "Failed to register admin",
          error,
        });
      }
    }
  });
exports.registerAdminController = registerAdminController;
// Admin dashboard for displaying customers' information
const getAllCustomersController = (_, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Fetch all customers data using the email.
      const customers = yield (0, customersService_1.getAllCustomers)();
      // Transform the data structure.
      const data = customers.map((customer, number) => {
        const { id, name, email, prefecture } = customer;
        return {
          No: number + 1,
          ID: id,
          Name: name,
          Email: email,
          Prefecture: prefecture,
        };
      });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.getAllCustomersController = getAllCustomersController;
// Admin dashboard for displaying instructors' information
const getAllInstructorsController = (_, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Fetch the admin data using the email.
      const instructors = yield (0, instructorsService_1.getAllInstructors)();
      // Transform the data structure.
      const data = instructors.map((instructor, number) => {
        const { id, name, nickname, email } = instructor;
        return {
          No: number + 1,
          ID: id,
          Name: name,
          Nickname: nickname,
          Email: email,
        };
      });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.getAllInstructorsController = getAllInstructorsController;
// Register instructor by admin
const registerInstructorController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const {
      name,
      email,
      password,
      nickname,
      icon,
      classURL,
      meetingId,
      passcode,
      introductionURL,
    } = req.body;
    try {
      // Hash the password.
      const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
      // Insert the instructor data into the DB.
      const instructor = yield (0, instructorsService_1.createInstructor)({
        name,
        email,
        password: hashedPassword,
        nickname,
        icon,
        classURL,
        meetingId,
        passcode,
        introductionURL,
      });
      // Exclude the password from the response.
      if (instructor) {
        const { password: _ } = instructor,
          instructorWithoutPassword = __rest(instructor, ["password"]);
        res.status(200).json({
          message: "Instructor is registered successfully",
          admin: instructorWithoutPassword,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: "Failed to register instructor",
          error,
        });
      }
    }
  });
exports.registerInstructorController = registerInstructorController;
// Admin dashboard for displaying instructors' information
const getAllChildrenController = (_, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Fetch all children data using the email.
      const children = yield (0, childrenService_1.getAllChildren)();
      // Transform the data structure.
      const data = children.map((child, number) => {
        const { id, name, customer, birthdate, personalInfo } = child;
        return {
          No: number + 1,
          ID: id,
          Name: name,
          "Customer ID": customer.id,
          "Customer name": customer.name,
          Birthdate:
            birthdate === null || birthdate === void 0
              ? void 0
              : birthdate.toISOString().slice(0, 10),
          "Personal info": personalInfo,
        };
      });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.getAllChildrenController = getAllChildrenController;
