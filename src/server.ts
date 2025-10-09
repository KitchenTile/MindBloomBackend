import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { logger } from "./middleware/logger.js";
import lessonRouter from "./routes/lessonRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import { bookHandler } from "./utils/injectionDataProcessor.js";
// import { dataLoader } from "./utils/data_loader.js";

const app = express();

connectDB().catch(console.dir);

app.use(express.json());

app.use(logger);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const PORT = process.env.PORT || 4000;

app.get("/", (_req, res) => {
  res.send("Server running as intended");
});

//use the routes created in the routes directories
app.use("/lessons", lessonRouter);
app.use("/orders", orderRouter);

app.listen(PORT, () => {
  console.log(`server running on localhost:${PORT}`);
});

const sampleMetadata = {
  topic: "AI",
  title: "A Practical Guide to RAG",
  chapters: 3,
  author: "J. Doe",
  year: 2024,
};

// const embeddings = await bookHandler(
//   "C:/Users/azuld/OneDrive/Documents/GitHub/MindBloomBackend/src/test.txt",
//   sampleMetadata
// );
// console.log(embeddings);

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
