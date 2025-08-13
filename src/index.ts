import express from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { checkDatabaseConnection } from "./database/init";
import messageRouter from "./routes/message.router";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/messages", messageRouter);

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
