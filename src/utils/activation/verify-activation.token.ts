import jwt from "jsonwebtoken";

const JWT_ACTIVATION_SECRET = process.env.JWT_ACTIVATION_SECRET as string;

type userInfo = {
  name: string;
  email: string;
  password: string;
};

export const verifyActivationToken = (token: string) => {
  const decoded = jwt.verify(token, JWT_ACTIVATION_SECRET) as userInfo;
  return decoded as userInfo;
};
