import { Request, Response, NextFunction } from "express";

type AuthenticatedUser = {
  id: string;
  userType: string;
};

export type RequestWithId = Request & {
  id: number;
  classId?: number;
  user?: AuthenticatedUser;
};

export function parseId(req: Request, res: Response, next: NextFunction) {
  const id = parseInt(req.params.id);
  const classId = req.params.classId ? parseInt(req.params.classId) : undefined;

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID provided." });
  }

  if (req.params.classId && isNaN(classId!)) {
    return res.status(400).json({ message: "Invalid class ID provided." });
  }

  (req as RequestWithId).id = id;
  if (classId !== undefined) {
    (req as RequestWithId).classId = classId;
  }

  next();
}
