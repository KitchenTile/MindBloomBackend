import express from "express";
import { handleChat } from "../controllers/ragControllers.js";

const ragRouter = express.Router();

//use the bussiness logic from the controllers
ragRouter.post("/", handleChat);

export default ragRouter;
