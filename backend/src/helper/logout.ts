import { Request, Response } from "express";
import { kv } from "@vercel/kv";

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

  // For production(Delete session data to Vercel KV)
  if (process.env.NODE_ENV === "production") {
    const sessionId = req.cookies["session-id"];
    if (sessionId) {
      await kv.set(sessionId, null);
    }
  }

  res.status(200).end();
};
