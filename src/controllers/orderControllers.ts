import { Request, Response } from "express";
import { connectDB } from "../config/db";
// import OrderModel from "../models/order";

export const addOrder = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();

    const { lessonIds, name, phoneNumber, numOfSpaces } = req.body;
    const lessonsOrdered = [];

    lessonIds.forEach((lesson: string, index: number) => {
      lessonsOrdered.push({
        lessonId: lesson,
        numOfSpaces: numOfSpaces[index],
      });
    });

    const order = { name, phoneNumber, lessonsOrdered };

    const addOrder = await db.collection("orders").insertOne(order);

    return res.status(201).json({ order });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error");
  }
};
