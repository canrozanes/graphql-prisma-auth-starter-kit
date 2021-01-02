import jwt from "jsonwebtoken";

const JWT_ACTIVATION_SECRET = process.env.JWT_ACTIVATION_SECRET as string;

export const generateActivationToken = (
  name: string,
  email: string,
  password: string
) =>
  jwt.sign({ name, email, password }, JWT_ACTIVATION_SECRET, {
    expiresIn: "10m",
  });
