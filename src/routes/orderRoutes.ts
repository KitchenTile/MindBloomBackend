import express from "express";
import { addOrder } from "../controllers/orderControllers.js";

const orderRouter = express.Router();

//use the bussiness logic from the controllers
orderRouter.post("/", addOrder);

export default orderRouter;
