import jwt from "jsonwebtoken";

const JWT_RESET_PASSWORD_SECRET = process.env
  .JWT_RESET_PASSWORD_SECRET as string;

export const generateResetPasswordToken = (userId: number, name: string) => {
  return jwt.sign({ userId, name }, JWT_RESET_PASSWORD_SECRET, {
    expiresIn: "10m",
  });
};
