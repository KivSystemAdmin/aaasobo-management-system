import { Request, Response, NextFunction } from "express";

export type RequestWithId = Request & { id: number };

export function parseId(req: Request, res: Response, next: NextFunction) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID provided." });
  }
  (req as RequestWithId).id = id;
  next();
}
