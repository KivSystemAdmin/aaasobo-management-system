import {
  Request,
  Response,
  NextFunction,
  RequestHandler,
  Router,
} from "express";
import { z } from "zod";
import { RouteConfig } from "../openapi/routerRegistry";

type AuthenticatedUser = {
  id: string;
  userType: string;
};

// Type-safe request interfaces for validated requests
export interface RequestWithBody<BodyT> extends Omit<Request, "body"> {
  body: BodyT;
  user?: AuthenticatedUser;
}

export interface RequestWithParams<ParamsT> extends Omit<Request, "params"> {
  params: ParamsT;
  user?: AuthenticatedUser;
}

export interface RequestWithQuery<QueryT> extends Omit<Request, "query"> {
  query: QueryT;
  user?: AuthenticatedUser;
}

// Flexible RequestWith interface supporting any combination of params, body, and query
export interface RequestWith<
  ParamsT = any,
  BodyT = any,
  QueryT = any,
> extends Omit<Request, "params" | "body" | "query"> {
  params: ParamsT;
  body: BodyT;
  query: QueryT;
  user?: AuthenticatedUser;
}

const validateBody = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          details: error.issues,
        });
      }
      return res.status(500).json({
        message: "Internal server error during validation",
      });
    }
  };
};

const validateParams = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid parameters",
          details: error.issues,
        });
      }
      return res.status(500).json({
        message: "Internal server error during parameter validation",
      });
    }
  };
};

const validateQuery = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid query parameters",
          details: error.issues,
        });
      }
      return res.status(500).json({
        message: "Internal server error during query validation",
      });
    }
  };
};

/**
 * Response validation middleware that validates outgoing JSON responses
 * Only runs in development environments to avoid production overhead
 */
const validateResponse = (
  responseSchemas: Record<
    string,
    { description: string; schema?: z.ZodTypeAny }
  >,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== "development") {
      return next();
    }

    const originalJson = res.json;

    // Override json method to validate response
    res.json = function (body: any) {
      const statusCode = res.statusCode.toString();
      const responseConfig = responseSchemas[statusCode];

      // If we have a schema for this status code, validate the response
      if (responseConfig?.schema) {
        try {
          // Simulate JSON round-trip to match actual HTTP response behavior
          const simulatedHttpResponse = JSON.parse(JSON.stringify(body));
          responseConfig.schema.parse(simulatedHttpResponse);
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error(
              `Response validation failed for ${req.method} ${req.path} (${statusCode}):`,
              {
                body,
                errors: error.issues,
                expectedSchema: responseConfig.description,
              },
            );

            // Return a 500 error instead of the invalid response
            res.status(500);
            return originalJson.call(this, {
              error: "Internal server error - response validation failed",
              details: {
                message: `Response does not match schema for status ${statusCode}`,
                validationErrors: error.issues,
                expectedSchema: responseConfig.description,
              },
            });
          }
        }
      }

      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Register route configs to an Express router with validation middleware
 */
export const registerRoutes = (
  router: Router,
  routeConfigs: Record<string, readonly RouteConfig[]>,
) => {
  Object.entries(routeConfigs).forEach(([path, configs]) => {
    configs.forEach((config) => {
      const middlewares = [];

      // Add custom middleware if specified
      if (config.middleware) {
        middlewares.push(...config.middleware);
      }

      // Add parameter validation middleware if schema exists
      if (config.paramsSchema) {
        middlewares.push(validateParams(config.paramsSchema));
      }

      // Add query validation middleware if schema exists
      if (config.querySchema) {
        middlewares.push(validateQuery(config.querySchema));
      }

      // Add body validation middleware if schema exists
      if (config.bodySchema) {
        middlewares.push(validateBody(config.bodySchema));
      }

      // Add response validation middleware
      middlewares.push(validateResponse(config.openapi.responses));

      // Add the handler (cast to RequestHandler for Express compatibility)
      middlewares.push(config.handler as RequestHandler);

      router[config.method](path, ...middlewares);
    });
  });
};
