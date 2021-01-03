import jwt from "jsonwebtoken";

const JWT_ACTIVATION_SECRET = process.env.JWT_ACTIVATION_SECRET as string;

type decoded = {
  email: string;
};

export const verifyActivationToken = (token: string) =>
  jwt.verify(token, JWT_ACTIVATION_SECRET) as decoded;
