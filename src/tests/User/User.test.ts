import { createTestContext } from "../utils/create-test-context";
import { emailService } from "../../utils/email-service";
import { userOne, userTwoAdmin, seedDatabase } from "../utils/seed-database";
import {
  signUpUser,
  confirmEmail,
  forgotPassword,
  resetPassword,
  login,
  me,
  updateMyself,
  getAllUsers,
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
      /Your account has been created/
    );

    const confirmEmailRes = await ctx.client.request(confirmEmail, {
      token: emailVerificationToken,
    });
    expect(confirmEmailRes.confirmEmail.message).toBe(
      "Activation succeeded, you can now sign-in."
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
      ctx.client.request(confirmEmail, {
        token: invalidToken,
      })
    ).rejects.toThrow("Email confirmation link is invalid");
  });
  it("should throw an error if email is already taken", async () => {
    const signUpVariables = {
      data: {
        name: "Candice",
        email: userOne.input.email,
        password: "abcd1234",
      },
    };

    await expect(
      ctx.client.request(signUpUser, signUpVariables)
    ).rejects.toThrow("Email is already taken");
  });
  it("should throw an error if email is not a valid email", async () => {
    const signUpVariables = {
      data: {
        name: "Candice",
        email: "notaValidEmail.com",
        password: "abcd1234",
      },
    };

    await expect(
      ctx.client.request(signUpUser, signUpVariables)
    ).rejects.toThrow("Please enter a valid email");
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

describe("User - updateMyself", () => {
  it("should properly update users", async () => {
    const requestHeaders = {
      authorization: `Bearer ${userOne.authToken}`,
    };
    const variables = {
      data: {
        email: "updatedEmail@example.com",
      },
    };

    const updateMyselfResponse = await ctx.client.request(
      updateMyself,
      variables,
      requestHeaders
    );

    expect(updateMyselfResponse.updateMyself.email).toBe(variables.data.email);
  });
});

describe("User - getAllUsers", () => {
  it("should return an empty array if user is not admin", async () => {
    const requestHeaders = {
      authorization: `Bearer ${userOne.authToken}`,
    };

    const updateMyselfRes = await ctx.client.request(
      getAllUsers,
      undefined,
      requestHeaders
    );

    expect(updateMyselfRes.users.length).toBe(0);
  });
  it("should return all the users if user is admin", async () => {
    const requestHeaders = {
      authorization: `Bearer ${userTwoAdmin.authToken}`,
    };

    const updateMyselfRes = await ctx.client.request(
      getAllUsers,
      undefined,
      requestHeaders
    );

    expect(updateMyselfRes.users.length).toBe(2);
  });
});
