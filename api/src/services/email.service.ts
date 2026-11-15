import { env, isProd } from "../config/env";
import { logger } from "../shared/logger";

const ENDPOINT = "https://api.brevo.com/v3/smtp/email";

async function rejectionDetails(res: Response) {
  try {
    const body = (await res.json()) as { code?: unknown; message?: unknown };
    const code = typeof body.code === "string" ? body.code.slice(0, 60) : undefined;
    const message = !isProd && typeof body.message === "string" ? body.message.slice(0, 200) : undefined;
    return { code, message };
  } catch {
    return {};
  }
}

export async function sendPasswordResetEmail(to: string, link: string): Promise<void> {
  if (!env.BREVO_API_KEY) {
    if (isProd) throw new Error("Email transport is not configured");
    logger.warn({ event: "email.not_configured" }, "BREVO_API_KEY is not set, email not sent");
    return;
  }
  if (!env.EMAIL_FROM) throw new Error("EMAIL_FROM is not set");

  const text = `Use this link within 30 minutes to reset your Comfort password:\n${link}\n\nIf you did not request this, ignore this email.`;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Comfort", email: env.EMAIL_FROM },
      to: [{ email: to }],
      subject: "Reset your Comfort password",
      textContent: text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    logger.error({ event: "email.provider_rejected", status: res.status, ...(await rejectionDetails(res)) });
    throw new Error(`Email provider responded ${res.status}`);
  }
}