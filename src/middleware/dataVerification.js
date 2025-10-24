export const verifyAddOrder = (req, res, next) => {
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
    return res.status(400).json({ message: "Lessons and spaces don't match" });
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

  if (!numOfSpaces.every((n) => typeof n === "number" && n > 0)) {
    return res
      .status(400)
      .json({ message: "numOfSpaces must be positive numbers" });
  }

  next();
};
