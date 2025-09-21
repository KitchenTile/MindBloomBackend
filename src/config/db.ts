import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("connected to db succesfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};
