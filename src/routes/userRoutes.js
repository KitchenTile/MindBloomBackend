import express from "express";
import { createUser, login, logout } from "../controllers/userControllers.js";

const userRouter = express.Router();

//use the bussiness logic from the controllers
userRouter.post("/", createUser);
userRouter.post("/login", login);
userRouter.post("/logout", logout);

// userRouter.get("/", getAllChats);
// userRouter.delete("/", deleteChat);
// userRouter.put("/", editChatTitle);

export default userRouter;
