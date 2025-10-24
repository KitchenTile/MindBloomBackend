import {
  comparePassword,
  hashPassword,
  isPasswordValid,
} from "../utils/passwordUtils.js";
import { connectDB } from "../config/db.js";

export const createUser = async (req, res) => {
  try {
    const db = await connectDB();
    const { userName, email, password, role } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).send("Missing required fields");
    }

    // if (!isPasswordValid(password)) {
    //   return res.status(400).send("Password not strong enough");
    // }

    const hashedPassword = await hashPassword(password);

    const user = { userName, email, hashedPassword, role };

    // upload user to db with hashed password
    const addUser = await db.collection("users").insertOne(user);

    return res.status(200).json({ user });
  } catch (error) {
    console.log(error);
  }
};

export const login = async (req, res) => {
  try {
    const db = await connectDB();
    const { email, password } = req.body;
    console.log(email);

    if (!email || !password)
      return res.status(400).send("Missing required fields");

    //get user from db
    const user = await db.collection("users").findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(user);

    //compare passwords
    const passwordMatch = await comparePassword(password, user.hashedPassword);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credential" });
    }
  } catch (error) {
    console.log(error);
  }
};
