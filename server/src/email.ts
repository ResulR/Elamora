import { Resend } from "resend";
import { config } from "./config.js";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let resendClient: Resend | null = null;

function getResendClient() {
  if (!config.email.configured) {
    throw new Error("email_not_configured");
  }

  if (!resendClient) {
    resendClient = new Resend(config.email.resendApiKey);
  }

  return resendClient;
}

export async function sendEmail(input: SendEmailInput) {
  const resend = getResendClient();

  const result = await resend.emails.send({
    from: config.email.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: config.email.replyTo,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return {
    provider: "resend",
    providerMessageId: result.data?.id ?? null,
  };
}
