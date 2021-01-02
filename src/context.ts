import { PrismaClient } from "@prisma/client";
import { db } from "./db";

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
export const context = (request: Context["request"]) => ({
  request,
  db,
});
