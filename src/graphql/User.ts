import { User as PrismaUserType } from "@prisma/client";
import {
  objectType,
  stringArg,
  nonNull,
  arg,
  inputObjectType,
  queryField,
  list,
  mutationField,
} from "nexus";
import bcrypt from "bcryptjs";
import { generateAuthToken, getUserId } from "../utils/auth";
import hashPassword from "../utils/hash-password";
import {
  generateActivationToken,
  verifyActivationToken,
} from "../utils/activation";
import { emailService } from "../utils/email-service";
import {
  generateResetPasswordToken,
  verifyResetPasswordToken,
} from "../utils/reset-password";

const EMAIL_FROM = process.env.EMAIL_FROM as string;

export const User = objectType({
  name: "User",
  definition(t) {
    t.model.id();
    t.model.name();
    t.model.email();
    t.model.isEmailConfirmed();
    t.model.role();
    t.model.createdAt();
    t.model.updatedAt();
  },
});

export const AuthPayload = objectType({
  name: "AuthPayload",
  definition(t) {
    t.nonNull.field("user", {
      type: "User",
    });
    t.nonNull.string("token");
  },
});

export const MessagePayload = objectType({
  name: "MessagePayload",
  definition(t) {
    t.nonNull.string("message");
  },
});

export const SignUpUserInput = inputObjectType({
  name: "SignUpUserInput",
  definition(t) {
    t.nonNull.string("name");
    t.nonNull.string("email");
    t.nonNull.string("password");
  },
});

export const LoginUserInput = inputObjectType({
  name: "LoginUserInput",
  definition(t) {
    t.nonNull.string("email");
    t.nonNull.string("password");
  },
});

export const UpdateUserInput = inputObjectType({
  name: "UpdateUserInput",
  definition(t) {
    t.string("name");
    t.string("email");
    t.string("password");
  },
});

export const getAllUsers = queryField("users", {
  type: nonNull(list(nonNull("User"))),
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

export const signUp = mutationField("signUp", {
  type: MessagePayload,
  args: {
    data: arg({ type: nonNull(SignUpUserInput) }),
  },
  async resolve(_root, args, { db }) {
    const { name, email, password } = args.data;
    const hashedPassword = await hashPassword(password);

    const activationToken = generateActivationToken(email);

    const html = emailService.activationEmail(activationToken);
    await emailService.sendEmail(EMAIL_FROM, email, "Account activation", html);

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return {
      message: `Your account has been created! We've sent an email to ${email}. Please follow the instruction on the email to activate your account`,
    };
  },
});

export const activateUser = mutationField("activateUser", {
  type: MessagePayload,
  args: {
    token: nonNull(stringArg()),
  },
  async resolve(_root, args, { db }) {
    const { token } = args;

    const { email } = verifyActivationToken(token);

    await db.user.update({
      where: {
        email,
      },
      data: {
        isEmailConfirmed: true,
      },
    });
    return {
      message: "Activation succeeded, you can now sign-in.",
    };
  },
});

export const forgotPassword = mutationField("forgotPassword", {
  type: "MessagePayload",
  args: {
    email: nonNull(stringArg()),
  },
  resolve: async (_root, args, { db }) => {
    const user = await db.user.findUnique({
      where: {
        email: args.email,
      },
    });
    if (!user) {
      return {
        message: `If the email: ${args.email} you provided is valid, you'll receive an email with instructions to reset your password.`,
      };
    }

    const token = generateResetPasswordToken(user.id, user.name);
    const html = emailService.resetPasswordEmail(token);

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetPasswordToken: token,
      },
    });

    await emailService.sendEmail(
      EMAIL_FROM,
      args.email,
      "Password Reset",
      html
    );

    return {
      message: `If the email: ${args.email} you provided is valid, you'll receive an email with instructions to reset your password.`,
    };
  },
});

const ResetPasswordInput = inputObjectType({
  name: "ResetPasswordInput",
  definition(t) {
    t.nonNull.string("token");
    t.nonNull.string("newPassword");
  },
});

export const ResetPassword = mutationField("resetPassword", {
  type: "MessagePayload",
  args: {
    data: arg({ type: nonNull(ResetPasswordInput) }),
  },
  async resolve(_root, args, { db }) {
    verifyResetPasswordToken(args.data.token);

    // If token is valid, the user must exists hence the "as PrismaUserType" at the end.
    const user = (await db.user.findFirst({
      where: {
        resetPasswordToken: args.data.token,
      },
    })) as PrismaUserType;

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: await hashPassword(args.data.newPassword),
        resetPasswordToken: "",
      },
    });
    return {
      message: `Your password has been updated. You can now sign-in!`,
    };
  },
});

export const login = mutationField("login", {
  type: "AuthPayload",
  args: {
    data: arg({ type: nonNull(LoginUserInput) }),
  },
  async resolve(_root, args, { db }) {
    const user = await db.user.findUnique({
      where: {
        email: args.data.email,
      },
    });
    if (!user) {
      throw new Error("Email or password does not match");
    }
    const isPasswordMatch = await bcrypt.compare(
      args.data.password,
      user.password
    );
    if (!isPasswordMatch) {
      throw new Error("Email or password does not match");
    }
    return {
      user,
      token: generateAuthToken(user.id),
    };
  },
});

export const getMe = queryField("me", {
  type: "User",
  resolve(_root, _args, { request, db }) {
    const userId = getUserId(request);
    return db.user.findUnique({ where: { id: userId } });
  },
});

export const updateUser = mutationField("updateUser", {
  type: User,
  args: {
    data: nonNull(arg({ type: UpdateUserInput })),
  },
  resolve(_root, args, { db, request }) {
    const userId = getUserId(request);
    return db.user.update({
      where: {
        id: userId,
      },
      data: {
        email: args.data.email ?? undefined,
        password: args.data.password ?? undefined,
        name: args.data.name ?? undefined,
      },
    });
  },
});
