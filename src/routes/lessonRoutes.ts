import express from "express";
import { getAllLessons } from "../controllers/lessonControllers";

const lessonRouter = express.Router();

lessonRouter.get("/", getAllLessons);

export default lessonRouter;
