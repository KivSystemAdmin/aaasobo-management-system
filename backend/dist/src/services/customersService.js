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
exports.getAllCustomers =
  exports.updateCustomer =
  exports.fetchCustomerById =
    void 0;
const prismaClient_1 = require("../../prisma/prismaClient");
const fetchCustomerById = (customerId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const customer = yield prismaClient_1.prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        throw new Error("Customer not found.");
      }
      return customer;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch customer.");
    }
  });
exports.fetchCustomerById = fetchCustomerById;
const updateCustomer = (id, name, email, prefecture) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Update the Customer data.
      const customer = yield prismaClient_1.prisma.customer.update({
        where: {
          id,
        },
        data: {
          name,
          email,
          prefecture,
        },
      });
      return customer;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to update the customer data.");
    }
  });
exports.updateCustomer = updateCustomer;
// Fetch all customers information
const getAllCustomers = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      return yield prismaClient_1.prisma.customer.findMany();
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch customers.");
    }
  });
exports.getAllCustomers = getAllCustomers;
