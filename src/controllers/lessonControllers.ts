import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { connectDB } from "../config/db";

export const getAllLessons = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const lessonsCollection = db.collection("lessons");

    const allLessons = await lessonsCollection.find({}).toArray();
    console.log(allLessons);
    return res.status(200).json(allLessons);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error");
  }
};

export const updateLesson = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const db = await connectDB();
    const lessonsCollection = db.collection("lessons");
    const ordersCollection = db.collection("orders");
    const currentOrder = await ordersCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    console.log(currentOrder);

    for (let i = 0; i < currentOrder.lessonsOrdered.length; i++) {
      await lessonsCollection.updateOne(
        { _id: new ObjectId(currentOrder.lessonsOrdered[i].lessonId) },
        { $inc: { numOfSpaces: -currentOrder.lessonsOrdered[i].numOfSpaces } }
      );
    }

    return res.status(200).json({ message: "Lessons updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error");
  }
};
