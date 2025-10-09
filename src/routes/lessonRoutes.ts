import express from "express";
import {
  getAllLessons,
  updateLesson,
} from "../controllers/lessonControllers.js";

const lessonRouter = express.Router();

//use the bussiness logic from the controllers
lessonRouter.get("/", getAllLessons);
lessonRouter.put("/:id", updateLesson);

export default lessonRouter;
