import { UserInputError } from "apollo-server";
import bcrypt from "bcryptjs";

const hashPassword = (password: string): Promise<string> => {
  if (password.length < 8) {
    throw new UserInputError("Password must be 8 characters or longer", {
      invalidArgs: "password",
    });
  }
  return bcrypt.hash(password, 10);
};

export default hashPassword;
