import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(hashedPassword);

  return hashedPassword;
};

export const comparePassword = async (password, userPassword) => {
  return await bcrypt.compare(password, userPassword);
};

export const isPasswordValid = (password) => {
  /*
   * At least one lowercase letter ((?=.*[a-z])).
   * At least one uppercase letter ((?=.*[A-Z])).
   * At least one digit ((?=.*\d)).
   * Consists of only alphanumeric characters ([a-zA-Z\d]).
   * Has a minimum length of 8 characters ({8,}).
   */
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

  return regex.test(password);
};
