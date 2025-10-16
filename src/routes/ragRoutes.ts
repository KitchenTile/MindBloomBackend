import express from "express";
import { getAllChats, handleChat } from "../controllers/ragControllers.js";

const ragRouter = express.Router();

//use the bussiness logic from the controllers
ragRouter.post("/", handleChat);
ragRouter.get("/", getAllChats);

export default ragRouter;
