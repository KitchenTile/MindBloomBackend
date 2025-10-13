import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { logger } from "./middleware/logger.js";
import lessonRouter from "./routes/lessonRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import ragRouter from "./routes/ragRoutes.js";
import { bookHandler } from "./utils/dataIngestionPipeline.js";
// import { getQuestionEmbedding } from "./utils/userDataRetrival.js";

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

const PORT = process.env.PORT || 4000;

app.get("/", (_req, res) => {
  res.send("Server running as intended");
});

//use the routes created in the routes directories
app.use("/lessons", lessonRouter);
app.use("/orders", orderRouter);
app.use("/chat", ragRouter);

const bookMetadata = {
  topic: "Full Stack Development Module",
  title: "Fll Stack Handbook",
  chapters: 10,
  author: "Middlesex University",
  year: 2025,
};

// bookHandler("src/data/FULLSTACKHANDBOOK.pdf", bookMetadata);

app.listen(PORT, () => {
  console.log(`server running on localhost:${PORT}`);
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err.stack || err.message);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
);
