import express from "express";

export const indexRouter = express.Router();

// http://localhost:4000/

indexRouter.get("/", (_, res) => {
  res.send("AMS API");
});
