import express from "express";
import {
  deleteChildController,
  getChildrenController,
  registerChildController,
  updateChildController,
  getChildByIdController,
} from "../../src/controllers/childrenController";

export const childrenRouter = express.Router();

// http://localhost:4000/children

childrenRouter.get("/", getChildrenController);
childrenRouter.get("/:id", getChildByIdController);
childrenRouter.post("/", registerChildController);
childrenRouter.patch("/:id", updateChildController);
childrenRouter.delete("/:id", deleteChildController);
