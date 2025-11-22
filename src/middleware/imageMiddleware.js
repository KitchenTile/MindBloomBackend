import fs from "fs";
import path from "path";

export const imageChecker = (req, res, next) => {
  // grab the param
  const imageFile = req.params.imageFile;

  // manually build joim the path
  const imagePath = path.join(
    "/Users/azuldebenedetti/Documents/GitHub/MindBloom_Front_End/MindBloom_vue_app/public",
    imageFile
  );

  console.log(imagePath);

  //access file if it exists else send error
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.sendFile(imagePath);
  });
};
