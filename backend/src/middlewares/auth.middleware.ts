import { NextFunction, Request, Response } from "express";

// Check if the user is authenticated or not.
export const requireAuthentication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session?.userType !== "admin") {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  next();
};

// Check if the admin session is authenticated or not.
export const authenticateAdminSession = async (req: Request, res: Response) => {
  res.status(200).json({
    isAuthenticated: req.session?.userType === "admin" || false,
  });
};

// Check if the customer session is authenticated or not.
export const authenticateCustomerSession = async (
  req: Request,
  res: Response
) => {
  const customerId = parseInt(req.params.id);
  if (isNaN(customerId)) {
    return res.status(400).json({ message: "Invalid customer ID" });
  }
  if (req.session?.isAdmin) {
    return res.status(200).json({ isAuthenticated: true });
  }
  const isAuthenticated =
    req.session?.userType === "customer" && req.session?.userId === customerId;
  res.status(200).json({ isAuthenticated });
};

// Check if the instructor session is authenticated or not.
export const authenticateInstructorSession = async (
  req: Request,
  res: Response
) => {
  const instructorId = parseInt(req.params.id);
  if (isNaN(instructorId)) {
    return res.status(400).json({ message: "Invalid customer ID" });
  }
  if (req.session?.isAdmin) {
    return res.status(200).json({ isAuthenticated: true });
  }
  const isAuthenticated =
    req.session?.userType === "instructor" &&
    req.session?.userId === instructorId;
  res.status(200).json({ isAuthenticated });
};
