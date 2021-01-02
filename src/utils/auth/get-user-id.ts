import jwt from "jsonwebtoken";
import { Context } from "../../context";

const JWT_AUTH_SECRET = process.env.JWT_AUTH_SECRET as string;

type Token = {
  userId: number;
};

export const getUserId = (request: Context["request"]): number | undefined => {
  const header = request.req
    ? request.req.headers.authorization
    : request.connection.context.Authorization;

  if (header) {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_AUTH_SECRET) as Token;

    return decoded.userId;
  }
};
