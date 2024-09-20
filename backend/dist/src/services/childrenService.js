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
exports.getAllChildren =
  exports.getChildById =
  exports.deleteChild =
  exports.updateChild =
  exports.registerChild =
  exports.getChildren =
    void 0;
const prismaClient_1 = require("../../prisma/prismaClient");
const getChildren = (customerId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    // Fetch the Children data from the DB
    try {
      const children = yield prismaClient_1.prisma.children.findMany({
        where: { customerId: parseInt(customerId) },
        include: { customer: true },
        orderBy: { id: "asc" },
      });
      return children;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch children.");
    }
  });
exports.getChildren = getChildren;
const registerChild = (name, birthdate, personalInfo, customerId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Insert the Child data into the DB.
      const child = yield prismaClient_1.prisma.children.create({
        data: {
          name,
          birthdate,
          personalInfo,
          customerId,
        },
      });
      return child;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to add a child.");
    }
  });
exports.registerChild = registerChild;
const updateChild = (childId, name, birthdate, personalInfo, customerId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Update the Child data.
      const child = yield prismaClient_1.prisma.children.update({
        where: {
          id: childId,
        },
        data: {
          name,
          birthdate,
          personalInfo,
          customerId,
        },
      });
      return child;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to update a child.");
    }
  });
exports.updateChild = updateChild;
const deleteChild = (tx, childId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Delete the Child data.
      const child = yield tx.children.delete({
        where: { id: childId },
      });
      return child;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to delete a child.");
    }
  });
exports.deleteChild = deleteChild;
const getChildById = (id) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const child = yield prismaClient_1.prisma.children.findUnique({
        where: { id },
      });
      return child;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch child.");
    }
  });
exports.getChildById = getChildById;
const getAllChildren = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    // Fetch the Children data from the DB
    try {
      const children = yield prismaClient_1.prisma.children.findMany({
        include: { customer: true },
        orderBy: { id: "asc" },
      });
      return children;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch all children.");
    }
  });
exports.getAllChildren = getAllChildren;
