import { createTransport } from "nodemailer";
import { generateActivationHtml } from "./generate-activation-html";
import { Token } from "./types";

const transport = createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export const emailService = {
  activationEmail(token: Token) {
    const html = generateActivationHtml(token);
    return html;
  },
  resetPasswordEmail(token: Token) {
    const html = `
    <h1>Please click the link below to reset your password</h1>
    <a target="_blank" href="${process.env.CLIENT_URL}/auth/password/reset/${token}">${process.env.CLIENT_URL}/auth/password/reset/${token}</a>
    `;
    return html;
  },
  sendEmail(from: string, to: string, subject: string, html: string) {
    return new Promise((resolve, reject) => {
      transport.sendMail({ from, subject, to, html }, (err, info) => {
        if (err) reject(err);
        resolve(info);
      });
    });
  },
};
