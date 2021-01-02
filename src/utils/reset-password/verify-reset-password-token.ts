import jwt from "jsonwebtoken";

const JWT_RESET_PASSWORD_SECRET = process.env
  .JWT_RESET_PASSWORD_SECRET as string;

type UserInfo = {
  userId: number;
  name: string;
} | void;

export const verifyResetPasswordToken = (token: string) => {
  const decoded = jwt.verify(token, JWT_RESET_PASSWORD_SECRET, (err) => {
    if (err) {
      throw new Error("Your reset link is invalid.");
    }
  }) as UserInfo;
  return decoded;
};
