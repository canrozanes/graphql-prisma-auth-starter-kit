import { objectType, inputObjectType } from "nexus";

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
      type: User,
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

export const UpdateMyselfInput = inputObjectType({
  name: "UpdateMyselfInput",
  definition(t) {
    t.string("name");
    t.string("email");
    t.string("password");
  },
});

export const ResendEmailConfirmationInput = inputObjectType({
  name: "ResendEmailConfirmationInput",
  definition(t) {
    t.nonNull.string("email");
  },
});

export const ResetPasswordInput = inputObjectType({
  name: "ResetPasswordInput",
  definition(t) {
    t.nonNull.string("token");
    t.nonNull.string("newPassword");
  },
});
