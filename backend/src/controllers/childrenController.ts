import { Request, Response } from "express";
import {
  deleteChild,
  getChildById,
  getChildren,
  registerChild,
  updateChild,
} from "../services/childrenService";

export const getChildrenController = async (req: Request, res: Response) => {
  const customerId = req.query.customerId as string;
  if (!customerId) {
    return res.status(400).json({ error: "customerId is required" });
  }

  try {
    const children = await getChildren(customerId);

    res.json({ children });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

export const registerChildController = async (req: Request, res: Response) => {
  const { name, customerId } = req.body;

  try {
    const child = await registerChild(name, customerId);

    res.status(200).json({
      message: "Child is registered successfully",
      child,
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

export const updateChildController = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, customerId } = req.body;

  try {
    const child = await updateChild(id, name, customerId);

    res.status(200).json({
      message: "Child is updated successfully",
      child,
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

export const deleteChildController = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    const child = await deleteChild(id);

    res.status(200).json({
      message: "Child is deleted successfully",
      child,
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

export const getChildByIdController = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    const child = await getChildById(id);

    res.json(child);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to fetch child data." });
  }
};
