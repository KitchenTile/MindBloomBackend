import { Request, Response } from "express";
import OrderModel from "../models/order";

export const getAllLessons = async (req: Request, res: Response) => {
  try {
    const allLessons = await OrderModel.find({}).lean();
  } catch (error) {
    console.log(error);
  }
};

export const addOrder = async (req: Request, res: Response) => {
  try {
    const allLessons = await OrderModel.find({}).lean();
  } catch (error) {
    console.log(error);
  }
};
