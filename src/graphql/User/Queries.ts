import { queryField, nonNull, list } from "nexus";
import { getUserId } from "../../utils/auth";
import { User } from "./Object-types";

export const getAllUsers = queryField("users", {
  type: nonNull(list(nonNull(User))),
  async resolve(_root, _args, { db, request }) {
    const userId = getUserId(request);
    const adminUser = await db.user.findFirst({
      where: {
        AND: [
          {
            role: "ADMIN",
          },
          {
            id: userId,
          },
        ],
      },
    });
    if (!adminUser) {
      return [];
    }
    return db.user.findMany();
  },
});

export const getMe = queryField("me", {
  type: User,
  resolve(_root, _args, { request, db }) {
    const userId = getUserId(request);
    return db.user.findUnique({ where: { id: userId } });
  },
});
