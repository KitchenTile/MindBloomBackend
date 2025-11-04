import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";

//get all the lessons
export const getAllLessons = async (req, res) => {
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

//update individual lessons basend on order
export const updateLesson = async (req, res) => {
  try {
    const db = await connectDB();
    const lessonsCollection = db.collection("lessons");
    const ordersCollection = db.collection("orders");
    const currentOrder = await ordersCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    for (let i = 0; i < currentOrder.lessonsOrdered.length; i++) {
      await lessonsCollection.updateOne(
        { _id: new ObjectId(currentOrder.lessonsOrdered[i].lessonId) },
        { $inc: { availability: -currentOrder.lessonsOrdered[i].availability } }
      );
    }

    return res.status(200).json({ message: "Lessons updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error");
  }
};
