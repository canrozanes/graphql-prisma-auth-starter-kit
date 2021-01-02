import { db } from "./db";
import { PrismaClient } from "@prisma/client";

export interface Context {
  db: PrismaClient;
  request: {
    req: {
      headers: {
        authorization: string;
      };
    };
    connection: {
      context: {
        Authorization: string;
      };
    };
  };
}
export const context = (request: Context["request"]) => {
  return {
    request,
    db,
  };
};
