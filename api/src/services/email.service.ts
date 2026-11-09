import nodemailer from "nodemailer";
import { env, isProd } from "../config/env";
import { logger } from "../shared/logger";

const transporter =
  env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD
    ? nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        secure: env.EMAIL_PORT === 465,
        requireTLS: env.EMAIL_PORT !== 465,
        auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASSWORD },
        connectionTimeout: 10_000,
        socketTimeout: 15_000,
      })
    : null;

export async function sendPasswordResetEmail(to: string, link: string): Promise<void> {
  const text = `Use this link within 30 minutes to reset your Comfort password:\n${link}\n\nIf you did not request this, ignore this email.`;
  if (!transporter) {
    if (isProd) throw new Error("Email transport is not configured");
    logger.info({ text }, "email (dev, not sent)");
    return;
  }
  await transporter.sendMail({ from: env.EMAIL_FROM, to, subject: "Reset your Comfort password", text });
}