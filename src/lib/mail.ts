import { Resend } from "resend";

export type AdminInviteMailInput = {
  to: string;
  name: string;
  password: string;
  role: string;
  loginUrl: string;
  mfaHint?: string;
};

export type SendMailResult =
  | { sent: true; mode: "resend" }
  | { sent: false; mode: "none"; reason: string };

function buildInviteBody(input: AdminInviteMailInput) {
  const mfaLine = input.mfaHint
    ? `\nMFA code (staging): ${input.mfaHint}\n`
    : "\nMFA is required at sign-in. Use the MFA method configured for your account.\n";

  return [
    `Hello ${input.name},`,
    "",
    "An administrator account has been created for you on the BirrBack Admin Panel.",
    "",
    `Login URL: ${input.loginUrl}`,
    `Email: ${input.to}`,
    `Temporary password: ${input.password}`,
    `Role: ${input.role}`,
    mfaLine.trimEnd(),
    "",
    "After you sign in, open Admins and use Change password on your own row to replace this temporary password.",
    "Do not forward this email. If you did not expect this account, contact your panel administrator.",
    "",
    "— BirrBack Admin Panel",
  ].join("\n");
}

/**
 * Sends admin invite credentials through Resend.
 * Requires RESEND_API_KEY. Does not log the password.
 */
export async function sendAdminCredentialsEmail(
  input: AdminInviteMailInput
): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM?.trim() || "BirrBack Panel <onboarding@resend.dev>";

  if (!apiKey) {
    return {
      sent: false,
      mode: "none",
      reason:
        "Email is not configured. Set RESEND_API_KEY in .env.local (and RESEND_FROM if you use a verified domain).",
    };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: "Your BirrBack Admin Panel login credentials",
    text: buildInviteBody(input),
  });

  if (error) {
    throw new Error(error.message);
  }

  return { sent: true, mode: "resend" };
}
