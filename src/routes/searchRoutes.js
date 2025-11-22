import express from "express";
import { search } from "../controllers/searchController.js";

const searchRouter = express.Router();

//use the bussiness logic from the controllers
searchRouter.get("/:searchTerm", search);

// userRouter.get("/", getAllChats);
// userRouter.delete("/", deleteChat);
// userRouter.put("/", editChatTitle);

export default searchRouter;
