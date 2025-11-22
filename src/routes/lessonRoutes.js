import express from "express";
import {
  getAllLessons,
  updateLesson,
} from "../controllers/lessonControllers.js";
import { imageChecker } from "../middleware/imageMiddleware.js";

const lessonRouter = express.Router();

//use the bussiness logic from the controllers
lessonRouter.get("/", getAllLessons);
lessonRouter.put("/:id", updateLesson);
lessonRouter.get("/images/:imageFile", imageChecker);

export default lessonRouter;
