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
exports.getAdmin = exports.createAdmin = void 0;
const prismaClient_1 = require("../../prisma/prismaClient");
const client_1 = require("@prisma/client");
// Create a new admin in the DB
const createAdmin = (adminData) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      return yield prismaClient_1.prisma.admins.create({
        data: adminData,
      });
    } catch (error) {
      if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        // P2002: Unique Constraint Violation
        if (error.code === "P2002") {
          throw new Error("Email is already registered");
        } else {
          console.error("Database Error:", error);
          throw new Error("Failed to register admin");
        }
      }
    }
  });
exports.createAdmin = createAdmin;
// Fetch the admin using the email
const getAdmin = (email) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      return yield prismaClient_1.prisma.admins.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch admin.");
    }
  });
exports.getAdmin = getAdmin;
