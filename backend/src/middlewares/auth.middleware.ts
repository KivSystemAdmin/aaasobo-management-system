import { NextFunction, Request, Response, RequestHandler } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userType: string;
  };
}

let joseModulePromise: Promise<{ jwtVerify: Function }> | undefined;
const getJoseModule = () => {
  if (!joseModulePromise) {
    joseModulePromise = import("jose");
  }
  return joseModulePromise;
};

// Verify user authentication using JWT
export function verifyAuthentication(
  requiredUserType: string[],
  options?: { requireIdCheck?: string[] },
): RequestHandler {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    // Load secret and salt from environment variables
    const secret = process.env.AUTH_SECRET;
    const salt = process.env.AUTH_SALT;

    // Check if the required environment variables are set
    if (!secret || !salt) {
      console.error(
        "Missing required environment variables: AUTH_SECRET or AUTH_SALT",
      );
      return res.status(500).json({ message: "Server configuration error" });
    }

    // The following console log is for debugging purposes only and should be removed in production
    // Leave it commented out for now
    // console.log("Logged date & time:", new Date().toISOString());
    // console.log("[Server Component] Request cookies:", req.headers.cookie);
    // console.log("[Client Component] Parsed cookies:", req.cookies);

    // Extract the JWT token from cookies
    const token = req.cookies?.[salt];

    // If no token is found, return 401 Unauthorized
    if (!token) {
      return res.status(401).json({ message: "No session token found" });
    }

    try {
      // Verify the JWT signature
      const { jwtVerify } = await getJoseModule();
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret),
      );

      // Check if the payload contains the required fields
      if (
        !payload.id ||
        !payload.userType ||
        typeof payload.id !== "string" ||
        typeof payload.userType !== "string"
      ) {
        return res.status(401).json({ message: "Invalid token payload" });
      }

      const userId = payload.id as string;
      const userType = payload.userType as string;

      // If a specific userType is required, enforce it here
      if (requiredUserType && !requiredUserType.includes(userType)) {
        return res
          .status(403)
          .json({ message: "Forbidden: insufficient permissions" });
      }

      // If ID check is required, enforce it here
      if (
        options &&
        options.requireIdCheck &&
        options.requireIdCheck.includes(userType)
      ) {
        const paramsId = req.params.id;

        // The following console log is for debugging purposes only and should be removed in production
        // Leave it commented out for now
        // console.log("=====");
        // console.log("Logged date & time:", new Date().toISOString());
        // console.log("ID check requirements:", options.requireIdCheck);
        // console.log("Required ID from params:", paramsId);
        // console.log("Checked ID from token:", userId);

        if (userId !== paramsId) {
          return res
            .status(403)
            .json({ message: "Forbidden: user ID mismatch" });
        }
      }

      // The following console log is for debugging purposes only and should be removed in production
      // Leave it commented out for now
      // console.log("=====");
      // console.log("Logged date & time:", new Date().toISOString());
      // console.log("Required user types:", requiredUserType);
      // console.log(`Authenticated user ID: ${userId}, Type: ${userType}`);

      // Attach user info to the request
      req.user = {
        id: userId,
        userType: userType,
      };

      next();
    } catch (error) {
      console.error("JWT verification failed:", error);
      return res.status(401).json({ message: "Invalid session token" });
    }
  };
}

// Verify cron job authorization
export async function verifyCronJobAuthorization(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}
