import express from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { checkDatabaseConnection } from "./database/init";
import messageRouter from "./routes/message.router";
import projectRouter from "./routes/project.router";
import { apiLimiter } from "./middleware/rateLimit.middleware";
import authRouter from "./routes/auth.router";
import cookieParser from "cookie-parser";
import profileRouter from "./routes/profile.router";

const app = express();

app.use(cors({ origin: "http://localhost:8080", credentials: true }));
app.use(cookieParser());
app.use(express.json());
// app.use(apiLimiter); // Rate limit for all the API requests, but can be set for individual routes as well later on

app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);
app.use("/api/projects", projectRouter);
app.use("/api/profile", profileRouter);

app.get("/", (req, res) => {
  res.send("Testing default route");
});

app.get("/health", (req, res) => {
  console.log("Health check");
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    env: ENV.NODE_ENV,
  });
});

app.get("/error", (req, res) => {
  throw new Error();
});

app.use(errorHandler);

app.listen(ENV.PORT, () => {
  checkDatabaseConnection();
  console.log(`Server is running on port ${ENV.PORT}`);
});
