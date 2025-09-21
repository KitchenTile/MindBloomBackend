import express from "express";
import { addOrder } from "../controllers/orderControllers";

const orderRouter = express.Router();

orderRouter.post("/", addOrder);

export default orderRouter;
