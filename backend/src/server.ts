import express from "express";
import cors from "cors";
import "dotenv/config";
import { instructorsRouter } from "./routes/instructorsRouter";

export const server = express();

const corsOptions = {
  origin: "http://localhost:3000", // Allow only frontend
};

// Middleware
server.use(express.json()); // to parse JSON bodies
server.use(cors(corsOptions)); // Allows requests from a different port (3000)

server.use("/instructors", instructorsRouter)