import { connectDB } from "../config/db.js";

export const addOrder = async (req, res) => {
  try {
    const db = await connectDB();

    const { name, phoneNumber, lessonsOrdered } = req.body;

    const order = { name, phoneNumber, lessonsOrdered };

    console.log("new order");
    console.log(order);

    const addOrder = await db.collection("orders").insertOne(order);

    console.log(addOrder);

    return res.status(201).json(addOrder.insertedId);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error");
  }
};
