import { createTestContext } from "../utils/create-test-context";
import { emailService } from "../../utils/email-service";
import { userOne, seedDatabase } from "../utils/seed-database";
import {
  signUpUser,
  activateUser,
  forgotPassword,
  resetPassword,
  login,
  me,
  updateUser,
} from "./operations";

const ctx = createTestContext();

const mockActivationEmail = jest.spyOn(emailService, "activationEmail");
mockActivationEmail.mockImplementation((token) => token);

const mockResetPasswordEmail = jest.spyOn(emailService, "resetPasswordEmail");
mockResetPasswordEmail.mockImplementation((token) => token);

const mockSendEmail = jest.spyOn(emailService, "sendEmail");

mockSendEmail.mockImplementation();

beforeEach(async () => {
  await seedDatabase(ctx);
});

describe("User - Sign-up", () => {
  it("should properly sign up a user", async () => {
    const signUpVariables = {
      data: {
        name: "Can",
        email: "can@example.com",
        password: "abcd1234",
      },
    };
    const signUpResponse = await ctx.client.request(
      signUpUser,
      signUpVariables
    );

    const emailVerificationToken = mockActivationEmail.mock.calls[0][0];

    expect(signUpResponse.signUp.message).toMatch(
      /Follow the instruction to activate your account/
    );

    const activateUserRes = await ctx.client.request(activateUser, {
      token: emailVerificationToken,
    });
    expect(activateUserRes.activateUser.message).toBe(
      "Activation succeeded, please sign-in."
    );

    const user = await ctx.db.user.findUnique({
      where: {
        email: signUpVariables.data.email,
      },
    });

    expect(user?.name).toBe(signUpVariables.data.name);
    expect(user?.email).toBe(signUpVariables.data.email);
  });
  it("should throw an error if password is less than 8 characters long", async () => {
    const variables = {
      data: { email: "solomon@example.com", password: "avc", name: "Solomon" },
    };
    await expect(ctx.client.request(signUpUser, variables)).rejects.toThrow();
  });
  it("should throw an error if activation token is not valid", async () => {
    const invalidToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiQ2FuIiwiZW1haWwiOiJjYW5AZXhhbXBsZS5jb20iLCJwYXNzd29yZCI6IiQyYSQxMCRxTjlwU3JJczNUMFFmZ2ZySTByT2tPLldXOWNRSHZ3OWRWdUoydWdQZGtLRUg1bG12SloxcSIsImlhdCI6MTYwOTU0Nzc0OCwiZXhwIjoxNjA5NTQ4MzQ4fQ.ORl4t_Lr-5wSW-aflMLo";
    await expect(
      ctx.client.request(activateUser, {
        token: invalidToken,
      })
    ).rejects.toThrow();
  });
});

describe("User - Login", () => {
  it("should properly log user in if email and password matches", async () => {
    const loginVariables = {
      data: {
        email: userOne.input.email,
        password: userOne.input.password,
      },
    };
    const loginResponse = await ctx.client.request(login, loginVariables);

    const requestHeaders = {
      authorization: `Bearer ${loginResponse.login.token}`,
    };
    expect(loginResponse.login.token).toBeTruthy();

    const meResponse = await ctx.client.request(me, undefined, requestHeaders);

    expect(meResponse.me.email).toBe(userOne.input.email);
  });
  it("should throw an error if email does not match a user", async () => {
    const variables = {
      data: {
        email: "somerandomemail@example.com",
        password: "1234abcd",
      },
    };
    await expect(ctx.client.request(login, variables)).rejects.toThrow();
  });
  it("should throw an error if email and password don't match", async () => {
    const variables = {
      data: {
        email: userOne.input.email,
        password: "1234abcd",
      },
    };
    await expect(ctx.client.request(login, variables)).rejects.toThrow();
  });
});

describe("User - Password Reset", () => {
  it("should properly reset password for a user", async () => {
    const forgotPasswordVariables = {
      email: userOne.user?.email,
    };
    const forgotPasswordResponse = await ctx.client.request(
      forgotPassword,
      forgotPasswordVariables
    );

    const resetPasswordToken = mockResetPasswordEmail.mock.calls[0][0];

    expect(forgotPasswordResponse.forgotPassword.message).toMatch(
      /you'll receive an email with instructions to reset your password/
    );

    const newPassword = "abcdef123456";
    const resetPasswordVariables = {
      data: {
        token: resetPasswordToken,
        newPassword,
      },
    };

    const resetPasswordResponse = await ctx.client.request(
      resetPassword,
      resetPasswordVariables
    );

    expect(resetPasswordResponse.resetPassword.message).toBe(
      `Your password has been updated. You can now sign-in!`
    );

    const loginVariables = {
      data: {
        email: userOne.user?.email,
        password: newPassword,
      },
    };

    const loginResponse = await ctx.client.request(login, loginVariables);

    expect(loginResponse.login.token).toBeTruthy();
  });
  it("should return a generic message and end the password reset flow if the email is not associated with any user", async () => {
    const forgotPasswordVariables = {
      email: "some-random-email@example.com",
    };
    const res = await ctx.client.request(
      forgotPassword,
      forgotPasswordVariables
    );
    expect(mockResetPasswordEmail).not.toHaveBeenCalled();
    expect(res.forgotPassword.message).toMatch(
      /you'll receive an email with instructions to reset your password/
    );
  });
  it("should stop resetting passwords if reset token is invalid", async () => {
    const invalidToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiQ2FuIiwiZW1haWwiOiJjYW5AZXhhbXBsZS5jb20iLCJwYXNzd29yZCI6IiQyYSQxMCRxTjlwU3JJczNUMFFmZ2ZySTByT2tPLldXOWNRSHZ3OWRWdUoydWdQZGtLRUg1bG12SloxcSIsImlhdCI6MTYwOTU0Nzc0OCwiZXhwIjoxNjA5NTQ4MzQ4fQ.ORl4t_Lr-5wSW-aflMLo";
    const variables = {
      data: {
        token: invalidToken,
        newPassword: "12345678a",
      },
    };
    await expect(
      ctx.client.request(resetPassword, variables)
    ).rejects.toThrow();
  });
});

describe("User - updateUser", () => {
  it("should properly update users", async () => {
    const requestHeaders = {
      authorization: `Bearer ${userOne.authToken}`,
    };
    const variables = {
      data: {
        email: "updatedEmail@example.com",
      },
    };

    const updateUserResponse = await ctx.client.request(
      updateUser,
      variables,
      requestHeaders
    );

    expect(updateUserResponse.updateUser.email).toBe(variables.data.email);
  });
});
