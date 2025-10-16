import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { logger } from "./middleware/logger.js";
import lessonRouter from "./routes/lessonRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import ragRouter from "./routes/ragRoutes.js";
import { bookHandler, getGptMetadata } from "./utils/dataIngestionPipeline.js";
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

// const textExtract =
//   "## Use R! _Series Editors:_ Robert Gentleman Kurt Hornik Giovanni G. Parmigiani For further volumes: [http://www.springer.com/series/6991](http://www.springer.com/series/6991) ## Kenneth Knoblauch • Laurence T. Maloney ## Modeling Psychophysical ## Data in R # 123 Kenneth Knoblauch Department of Integrative Neurosciences Stem-cell and Brain Research Institute INSERM U846 18 avenue du Doyen Lépine Bron, France Laurence T. Maloney Department of Psychology Center for Neural Science New York University 6 Washington Place, 2nd Floor New York, USA _Series Editors:_ Robert Gentleman Program in Computational Biology Division of Public Health Sciences Fred Hutchinson Cancer Research Center 1100 Fairview Ave. N, M2-B876 Seattle, Washington 98109-1024 USA Giovanni G. Parmigiani The Sidney Kimmel Comprehensive Cancer Center at Johns Hopkins University 550 North Broadway Baltimore, MD 21205-2011 USA";

// getGptMetadata(textExtract);
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
