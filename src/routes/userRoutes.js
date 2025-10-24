import express from "express";
import { createUser, login } from "../controllers/userControllers.js";

const userRouter = express.Router();

//use the bussiness logic from the controllers
userRouter.post("/", createUser);
userRouter.post("/login", login);

// userRouter.get("/", getAllChats);
// userRouter.delete("/", deleteChat);
// userRouter.put("/", editChatTitle);

export default userRouter;
