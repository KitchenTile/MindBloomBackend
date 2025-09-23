import { Request, Response } from "express";
import { connectDB } from "../config/db";

export const getAllLessons = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const lessonsCollection = db.collection("lessons");

    const allLessons = await lessonsCollection.find({}).toArray();
    console.log(allLessons);
    return res.status(200).send(allLessons);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error");
  }
};

export const updateLesson = async (req: Request, res: Response) => {
  try {
    // const lessonIds = req.body.
  } catch (error) {
    console.log(error);
  }
};
