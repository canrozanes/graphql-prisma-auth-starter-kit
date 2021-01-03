import jwt from "jsonwebtoken";

const JWT_ACTIVATION_SECRET = process.env.JWT_ACTIVATION_SECRET as string;

export const generateActivationToken = (email: string) =>
  jwt.sign({ email }, JWT_ACTIVATION_SECRET, {
    expiresIn: "10m",
  });
