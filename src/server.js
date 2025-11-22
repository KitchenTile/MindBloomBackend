import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { logger } from "./middleware/logger.js";
import lessonRouter from "./routes/lessonRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import ragRouter from "./routes/ragRoutes.js";
import userRouter from "./routes/userRoutes.js";
import searchRouter from "./routes/searchRoutes.js";

const app = express();

connectDB().catch(console.dir);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use(logger);

const PORT = process.env.PORT || 8080;

app.get("/", (_req, res) => {
  res.send("Server running as intended");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

//use the routes created in the routes directories
app.use("/lessons", lessonRouter);
app.use("/orders", orderRouter);
app.use("/chat", ragRouter);
app.use("/users", userRouter);
app.use("/search", searchRouter);

app.listen(PORT, () => {
  console.log(`server running on localhost:${PORT}`);
});

app.use((err, req, res, next) => {
  console.error("Error:", err.stack || err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
