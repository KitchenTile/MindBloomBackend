import express from "express";
import { getAllLessons, updateLesson } from "../controllers/lessonControllers";

const lessonRouter = express.Router();

lessonRouter.get("/", getAllLessons);
lessonRouter.put("/:id", updateLesson);

export default lessonRouter;
