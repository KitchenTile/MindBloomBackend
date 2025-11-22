import { connectDB } from "../config/db.js";

export const search = async (req, res) => {
  try {
    const db = await connectDB();
    const lessonsArray = [];
    const lessonsCollection = db.collection("lessons");
    const matchingLessons = await lessonsCollection
      .find({
        $or: [
          { topic: { $regex: req.params.searchTerm } },
          { location: { $regex: req.params.searchTerm } },
          { price: { $regex: req.params.searchTerm } },
          { availability: { $regex: req.params.searchTerm } },
        ],
      })
      .toArray();

    for await (const doc of matchingLessons) {
      lessonsArray.push(doc);
    }

    return res.status(200).json(matchingLessons);
  } catch (error) {
    console.log(error);
  }
};
