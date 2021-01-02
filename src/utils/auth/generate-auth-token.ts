import jwt from "jsonwebtoken";

const JWT_AUTH_SECRET = process.env.JWT_AUTH_SECRET as string;

export const generateAuthToken = (userId: number) => {
  return jwt.sign({ userId }, JWT_AUTH_SECRET, {
    expiresIn: "7 days",
  });
};
