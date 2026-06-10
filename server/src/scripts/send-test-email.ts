import { sendEmail } from "../email.js";

async function main() {
  const to = process.env.EMAIL_TEST_TO?.trim();

  if (!to) {
    throw new Error("EMAIL_TEST_TO is required");
  }

  const result = await sendEmail({
    to,
    subject: "Elamora test email",
    html: "<p>This is a test email from Elamora.</p>",
    text: "This is a test email from Elamora.",
  });

  console.log("Test email sent");
  console.log({
    provider: result.provider,
    providerMessageId: result.providerMessageId,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
