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
