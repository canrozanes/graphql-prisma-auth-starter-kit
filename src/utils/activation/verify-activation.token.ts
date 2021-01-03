import jwt from "jsonwebtoken";

const JWT_ACTIVATION_SECRET = process.env.JWT_ACTIVATION_SECRET as string;

type userInfo = {
  email: string;
};

export const verifyActivationToken = (token: string) => {
  const decoded = jwt.verify(token, JWT_ACTIVATION_SECRET) as userInfo;
  return decoded as userInfo;
};
