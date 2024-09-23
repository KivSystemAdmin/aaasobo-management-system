import express from "express";
export const indexRouter = express.Router();

// http://localhost:4000/

indexRouter.get("/", (_, res) => {
  res.json({
    message: "Welcome to AaasoBo! Management System API.",
  });
});
