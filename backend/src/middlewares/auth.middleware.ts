import { Request, Response } from "express";
import { prisma } from "../../prisma/prismaClient";

interface UserSession {
  id: string;
  userId: number;
  isAdmin: boolean;
  isCustomer: boolean;
  isInstructor: boolean;
}

// Create a session for login
export const createSession = async (req: Request, _: Response) => {
  if (!req.session) {
    return;
  }
  const { userId, isAdmin, isCustomer, isInstructor } = req.session;
  const session = await prisma.userSession.create({
    data: {
      userId: userId,
      isAdmin: isAdmin,
      isCustomer: isCustomer,
      isInstructor: isInstructor,
    },
  });

  req.session = session;
  return session;
};

export const authenticateSession = async (req: Request, res: Response) => {
  const requestUrl = req.originalUrl;
  let redirectUrl: string | undefined;

  if (req.session && req.session.id) {
    const sessionId = req.session.id;
    const session: UserSession | null = await prisma.userSession.findUnique({
      where: {
        id: sessionId,
      },
    });
    redirectUrl = manageRedirectUrl(requestUrl, session || undefined);
  } else {
    redirectUrl = manageRedirectUrl(requestUrl, undefined);
  }

  const isAuthenticated = redirectUrl ? !redirectUrl.includes("login") : false;

  if (isAuthenticated) {
    res.status(200).json({
      message: "Authenticated",
      redirectUrl: redirectUrl,
      session: req.session,
    });
  } else {
    res.status(401).json({
      message: "Unauthorized",
      redirectUrl: redirectUrl,
    });
  }
};

// Manage redirect URL.
const manageRedirectUrl = (
  requestUrl: string,
  session: UserSession | undefined
) => {
  const adminsUrl = "/admins/";
  const customersUrl = "/customers/";
  const instructorsUrl = "/instructors/";

  let userId = 0;
  let isAdmin = false;
  let isCustomer = false;
  let isInstructor = false;

  if (session) {
    ({ userId, isAdmin, isCustomer, isInstructor } = session);
  }

  // Redirect to the admin's URL.
  if (requestUrl.includes(adminsUrl)) {
    if (isAdmin) {
      return requestUrl;
    } else {
      return "/admins/login";
    }

    // Redirect to the customer's URL.
  } else if (requestUrl.includes(customersUrl)) {
    if (isAdmin || isCustomer) {
      const condition1 = requestUrl.includes(customersUrl + userId);
      const condition2 = !requestUrl.match(/\d/);

      if (condition1 || condition2) {
        return requestUrl;
      } else {
        return "/customers/login";
      }
    } else {
      return "/customers/login";
    }

    // Redirect to the instructor's URL.
  } else if (requestUrl.includes(instructorsUrl)) {
    if (isAdmin || isInstructor) {
      const condition1 = requestUrl.includes(instructorsUrl + userId);
      const condition2 = !requestUrl.match(/\d/);

      if (condition1 || condition2) {
        return requestUrl;
      } else {
        return "/instructors/login";
      }
    } else {
      return "/instructors/login";
    }
  }
};
