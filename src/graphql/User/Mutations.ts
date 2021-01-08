import { Prisma, User as PrismaUserType } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  UserInputError,
  ForbiddenError,
  AuthenticationError,
} from "apollo-server";
import { mutationField, arg, nonNull, stringArg } from "nexus";
import isEmail from "validator/lib/isEmail";
import {
  generateActivationToken,
  verifyActivationToken,
} from "../../utils/activation";
import { generateAuthToken, getUserId } from "../../utils/auth";
import { emailService } from "../../utils/email-service";
import { NotFoundError } from "../../utils/errors";
import hashPassword from "../../utils/hash-password";
import {
  generateResetPasswordToken,
  verifyResetPasswordToken,
} from "../../utils/reset-password";
import {
  MessagePayload,
  SignUpUserInput,
  ResendEmailConfirmationInput,
  ResetPasswordInput,
  LoginUserInput,
  User,
  UpdateMyselfInput,
} from "./Object-types";

const EMAIL_FROM = process.env.EMAIL_FROM as string;

export const signUp = mutationField("signUp", {
  type: MessagePayload,
  args: {
    data: arg({ type: nonNull(SignUpUserInput) }),
  },
  async resolve(_root, args, { db }) {
    const { name, email, password } = args.data;

    if (!isEmail(email)) {
      throw new UserInputError("Please enter a valid email", {
        invalidArgs: "email",
      });
    }
    const hashedPassword = await hashPassword(password);

    const userExists = await db.user.findUnique({
      where: {
        email: args.data.email,
      },
    });

    if (userExists) {
      throw new UserInputError("Email is already taken", {
        invalidArgs: "email",
      });
    }

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

export const resendConfirmationEmail = mutationField(
  "resendConfirmationEmail",
  {
    type: MessagePayload,
    args: {
      data: arg({ type: nonNull(ResendEmailConfirmationInput) }),
    },
    async resolve(_root, args, { db }) {
      const user = await db.user.findUnique({
        where: {
          email: args.data.email,
        },
      });

      if (!user) {
        throw new NotFoundError(
          `There are no users associated with this email: ${args.data.email}.`
        );
      }

      if (user.isEmailConfirmed) {
        throw new ForbiddenError(
          `This email: ${args.data.email} is already confirmed`
        );
      }

      const activationToken = generateActivationToken(args.data.email);
      const html = emailService.activationEmail(activationToken);
      await emailService.sendEmail(
        EMAIL_FROM,
        args.data.email,
        "Account activation",
        html
      );

      return {
        message: `We've sent an email to ${args.data.email}. Please follow the instruction on the email to confirm your account.`,
      };
    },
  }
);

export const confirmEmail = mutationField("confirmEmail", {
  type: MessagePayload,
  args: {
    token: nonNull(stringArg()),
  },
  async resolve(_root, args, { db }) {
    const { token } = args;
    let email = "";
    try {
      const userInfo = verifyActivationToken(token);
      email = userInfo.email;
    } catch (e) {
      throw new AuthenticationError("Email confirmation link is invalid");
    }

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
      throw new AuthenticationError("Email or password does not match");
    }
    const isPasswordMatch = await bcrypt.compare(
      args.data.password,
      user.password
    );
    if (!isPasswordMatch) {
      throw new AuthenticationError("Email or password does not match");
    }
    if (!user.isEmailConfirmed) {
      throw new ForbiddenError(
        "You need to confirm your email before your first login"
      );
    }
    return {
      user,
      token: generateAuthToken(user.id),
    };
  },
});

export const updateMyself = mutationField("updateMyself", {
  type: User,
  args: {
    data: nonNull(arg({ type: UpdateMyselfInput })),
  },
  async resolve(_root, args, { db, request }) {
    const userId = getUserId(request);
    const { email, password, name } = args.data;

    const opsData: Prisma.UserUpdateInput = {
      email: undefined,
      password: undefined,
      name: undefined,
    };

    if (email && !isEmail(email)) {
      throw new UserInputError("Please enter a valid email", {
        invalidArgs: "email",
      });
    }

    if (email && isEmail(email)) {
      opsData.email = email;
    }

    if (password) {
      opsData.password = await hashPassword(password);
    }

    if (name) {
      opsData.name = name;
    }

    return db.user.update({
      where: {
        id: userId,
      },
      data: opsData,
    });
  },
});
