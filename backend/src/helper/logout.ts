import { Request, Response } from "express";

export const logout = async (req: Request, res: Response, userType: string) => {
  if (!req.session?.userType) {
    return res.status(200).end();
  }
  if (req.session.userType !== userType) {
    return res.status(401).json({
      message: `You are now logged in as ${req.session!.userType}.`,
    });
  }
  req.session = null;
  res.status(200).end();
};
