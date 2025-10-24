import express from "express";
import {
  deleteChat,
  editChatTitle,
  getAllChats,
  handleChat,
} from "../controllers/ragControllers.js";

const ragRouter = express.Router();

//use the bussiness logic from the controllers
ragRouter.post("/", handleChat);
ragRouter.get("/", getAllChats);
ragRouter.delete("/", deleteChat);
ragRouter.put("/", editChatTitle);

export default ragRouter;
