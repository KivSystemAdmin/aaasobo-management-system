import express from "express";
import {
  deleteChildController,
  getChildrenController,
  registerChildController,
  updateChildController,
} from "../controllers/childrenController";

export const childrenRouter = express.Router();

// http://localhost:4000/children

childrenRouter.get("/", getChildrenController);
childrenRouter.post("/", registerChildController);
childrenRouter.patch("/:id", updateChildController);
childrenRouter.delete("/:id", deleteChildController);
