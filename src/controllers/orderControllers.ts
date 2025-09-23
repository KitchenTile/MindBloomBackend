import { Request, Response } from "express";
import { connectDB } from "../config/db";
// import OrderModel from "../models/order";

export const addOrder = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const allLessons = db.collection("lessons").find({});
  } catch (error) {
    console.log(error);
  }
};
