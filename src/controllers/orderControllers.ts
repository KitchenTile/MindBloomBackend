import { Request, Response } from "express";
import { connectDB } from "../config/db";

export const addOrder = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();

    const { lessonIds, name, phoneNumber, numOfSpaces } = req.body;

    if (!lessonIds || !name || !phoneNumber || !numOfSpaces) {
      return res.status(400).json({ message: "Required entries missing" });
    }

    if (!Array.isArray(lessonIds) || !Array.isArray(numOfSpaces)) {
      return res
        .status(400)
        .json({ message: "lessonIds and numOfSpaces must be arrays" });
    }

    if (lessonIds.length !== numOfSpaces.length) {
      return res
        .status(400)
        .json({ message: "Lessons and spaces don't match" });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Name must be at least 2 characters" });
    }

    if (typeof phoneNumber !== "string" || phoneNumber.trim().length < 7) {
      return res
        .status(400)
        .json({ message: "Phone number must be at least 7 characters" });
    }

    if (!numOfSpaces.every((n: any) => typeof n === "number" && n > 0)) {
      return res
        .status(400)
        .json({ message: "numOfSpaces must be positive numbers" });
    }

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
