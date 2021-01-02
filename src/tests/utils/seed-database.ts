import { Prisma, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createGzip } from "zlib";
import { emailService } from "../../utils/email-service";
import { login } from "../User/operations";
import { TestContext } from "./create-test-context";

type SeededUser = {
  input: Prisma.UserCreateArgs["data"];
  user: User | undefined;
  authToken: string | undefined;
};

export const userOne: SeededUser = {
  input: {
    name: "Jen",
    email: "jen@example.com",
    password: "abcd1234",
  },
  user: undefined,
  authToken: undefined,
};

export const userTwo: SeededUser = {
  input: {
    name: "John",
    email: "john@example.com",
    password: "abcd1234",
  },
  user: undefined,
  authToken: undefined,
};

export const seedDatabase = async (ctx: TestContext) => {
  await ctx.db.user.deleteMany();

  userOne.user = await ctx.db.user.create({
    data: {
      name: userOne.input.name,
      email: userOne.input.email,
      password: bcrypt.hashSync(userOne.input.password),
    },
  });
  userOne.authToken = await ctx.client
    .request(login, {
      data: {
        email: userOne.input.email,
        password: userOne.input.password,
      },
    })
    .then((res) => res.login.token);

  userTwo.user = await ctx.db.user.create({
    data: {
      name: userTwo.input.name,
      email: userTwo.input.email,
      password: bcrypt.hashSync(userTwo.input.password),
    },
  });

  userTwo.authToken = await ctx.client
    .request(login, {
      data: {
        email: userTwo.input.email,
        password: userTwo.input.password,
      },
    })
    .then((res) => res.login.token);
};
